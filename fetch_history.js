const axios = require('axios');
const fs = require('fs');
const path = require('path');

const SYMBOL = 'LASSECASH';
const TODAY = new Date();
const TWO_YEARS_AGO = new Date();
TWO_YEARS_AGO.setFullYear(TODAY.getFullYear() - 2);

async function fetchTwoYearHistory() {
    console.log(`Fetching available 2-year history for ${SYMBOL}...`);
    
    let rawItems = [];
    try {
        const url = `https://history.hive-engine.com/marketHistory?symbol=${SYMBOL}&limit=1000`;
        const response = await axios.get(url, { timeout: 10000 });
        if (response.data && Array.isArray(response.data)) {
            rawItems = response.data;
        }
    } catch (err) {
        console.log("Error fetching market history:", err.message);
    }

    const dailyMap = {};
    rawItems.forEach(item => {
        const timestamp = item.timestamp;
        if (timestamp) {
            const dateStr = new Date(timestamp > 10000000000 ? timestamp : timestamp * 1000).toISOString().split('T')[0];
            const closePrice = parseFloat(item.closePrice || 0);
            const volume = parseFloat(item.volumeToken || item.volumeHive || 0);

            if (closePrice > 0 && closePrice < 0.1) {
                dailyMap[dateStr] = { price: closePrice, volume: volume };
            }
        }
    });

    let currentLivePrice = 0.0220;
    try {
        const metricRes = await axios.post('https://api.hive-engine.com/rpc/contracts', {
            jsonrpc: '2.0',
            method: 'find',
            params: { contract: 'market', table: 'metrics', query: { symbol: SYMBOL } },
            id: 1
        });
        if (metricRes.data?.result?.[0]?.lastPrice) {
            currentLivePrice = parseFloat(metricRes.data.result[0].lastPrice);
        }
    } catch (e) {}

    let dataPoints = [];
    let currentDate = new Date(TWO_YEARS_AGO);
    let lastValidPrice = 0.0030;

    while (currentDate <= TODAY) {
        const dateStr = currentDate.toISOString().split('T')[0];

        if (dailyMap[dateStr]) {
            lastValidPrice = dailyMap[dateStr].price;
            dataPoints.push({
                date: dateStr,
                price: lastValidPrice,
                volume: dailyMap[dateStr].volume
            });
        } else {
            dataPoints.push({
                date: dateStr,
                price: lastValidPrice,
                volume: 0
            });
        }

        currentDate.setDate(currentDate.getDate() + 1);
    }

    // Manually check and flatten the spike around July 9, 10, and 11, 2026
    dataPoints.forEach(pt => {
        if (pt.date === '2026-07-09' || pt.date === '2026-07-10' || pt.date === '2026-07-11') {
            pt.price = 0.01;
        }
    });

    if (dataPoints.length > 0) {
        dataPoints[dataPoints.length - 1].price = currentLivePrice;
    }

    const outputObj = {
        symbol: SYMBOL,
        inception: TWO_YEARS_AGO.toISOString().split('T')[0],
        data_points: dataPoints
    };

    const filePath = path.join(__dirname, 'data', 'daily_history.json');
    fs.writeFileSync(filePath, JSON.stringify(outputObj, null, 2));
    console.log(`Successfully generated history with manual July 2026 spike override applied!`);
}

fetchTwoYearHistory();