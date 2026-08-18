const axios = require('axios');
const fs = require('fs');
const path = require('path');

const RPC_URL = 'https://api.hive-engine.com/rpc/contracts';
const SYMBOL = 'LASSECASH';

async function run() {
    console.log(`Querying all historical on-chain trades for ${SYMBOL}...`);
    let allTrades = [];
    let offset = 0;
    let limit = 1000;
    let fetching = true;

    while (fetching) {
        try {
            const response = await axios.post(RPC_URL, {
                jsonrpc: '2.0',
                method: 'find',
                params: {
                    contract: 'market',
                    table: 'tradesHistory',
                    query: { symbol: SYMBOL },
                    limit: limit,
                    offset: offset
                },
                id: 1
            });

            const trades = response.data.result || [];
            if (trades.length === 0) {
                fetching = false;
            } else {
                allTrades = allTrades.concat(trades);
                offset += limit;
                console.log(`Fetched total ${allTrades.length} trades so far...`);
                
                // Stop if we received fewer than the limit, meaning we hit the end
                if (trades.length < limit) {
                    fetching = false;
                }
            }

            // Rate limit courtesy pause
            await new Promise(resolve => setTimeout(resolve, 250));
        } catch (error) {
            console.error(`Error at offset ${offset}:`, error.message);
            fetching = false;
        }
    }

    console.log(`Finished! Total historical on-chain trades found: ${allTrades.length}`);

    // Aggregate into daily closing points for the chart
    const dailyMap = {};
    allTrades.forEach(trade => {
        // Handle block timestamp (usually seconds)
        const timestamp = trade.timestamp || trade._id; 
        const dateStr = new Date(timestamp * 1000).toISOString().split('T')[0];
        const price = parseFloat(trade.price);
        const volume = parseFloat(trade.quantity || trade.volume);

        if (!dailyMap[dateStr]) {
            dailyMap[dateStr] = { date: dateStr, price: price, volume: volume };
        } else {
            dailyMap[dateStr].price = price; // Latest price of the day (close)
            dailyMap[dateStr].volume += volume; // Accumulate volume
        }
    });

    const dataPoints = Object.values(dailyMap).sort((a, b) => new Date(a.date) - new Date(b.date));

    const outputObj = {
        symbol: SYMBOL,
        inception: "2019-06-28",
        data_points: dataPoints
    };

    const filePath = path.join(__dirname, 'data', 'daily_history.json');
    fs.writeFileSync(filePath, JSON.stringify(outputObj, null, 2));
    console.log(`Successfully compiled and saved ${dataPoints.length} daily data points to ${filePath}!`);
}

run();