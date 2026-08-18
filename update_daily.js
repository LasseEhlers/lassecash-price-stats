const fs = require('fs');
const path = require('path');
const axios = require('axios');

const SYMBOL = 'LASSECASH';
const filePath = path.join(__dirname, 'data', 'daily_history.json');

async function runDailyUpdate() {
    console.log(`Checking live stats for ${SYMBOL} to update daily history...`);

    if (!fs.existsSync(filePath)) {
        console.error("Error: daily_history.json not found!");
        return;
    }

    const rawData = fs.readFileSync(filePath, 'utf8');
    const history = JSON.parse(rawData);

    // Fetch live market metrics from Hive Engine RPC
    let currentPrice = 0.0388;
    let currentVolume = 1000;

    try {
        const response = await axios.post('https://api.hive-engine.com/rpc/contracts', {
            jsonrpc: '2.0',
            method: 'find',
            params: {
                contract: 'market',
                table: 'metrics',
                query: { symbol: SYMBOL }
            },
            id: 1
        });

        const metrics = response.data.result && response.data.result[0] ? response.data.result[0] : null;
        if (metrics) {
            currentPrice = parseFloat(metrics.lastPrice || currentPrice);
            currentVolume = parseFloat(metrics.volume || currentVolume);
            console.log(`Successfully pulled live network metrics: Price = ${currentPrice}, Volume = ${currentVolume}`);
        }
    } catch (e) {
        console.log("Could not reach live RPC node, skipping automated update.");
        return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const lastEntry = history.data_points[history.data_points.length - 1];

    if (lastEntry && lastEntry.date === todayStr) {
        // Update today's existing entry with the latest close/price point
        lastEntry.price = currentPrice;
        lastEntry.volume = currentVolume;
        console.log(`Updated existing entry for today (${todayStr}) with latest price: ${currentPrice}`);
    } else {
        // Append new day's record
        history.data_points.push({
            date: todayStr,
            price: currentPrice,
            volume: currentVolume
        });
        console.log(`Appended new daily record for (${todayStr}) with price: ${currentPrice}`);
    }

    fs.writeFileSync(filePath, JSON.stringify(history, null, 2));
    console.log("daily_history.json successfully updated and saved!");
}

runDailyUpdate();