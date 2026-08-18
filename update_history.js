const fs = require('fs');
const path = require('path');
const axios = require('axios');

async function updateDailyHistory() {
    const filePath = path.join(__dirname, 'data', 'daily_history.json');
    
    if (!fs.existsSync(filePath)) {
        console.error("Error: daily_history.json not found.");
        return;
    }

    // 1. Read existing archive
    const rawData = fs.readFileSync(filePath, 'utf8');
    const history = JSON.parse(rawData);

    // 2. Fetch live metrics from Hive Engine
    try {
        const response = await axios.post('https://api.hive-engine.com/rpc/markets', {
            jsonrpc: '2.0',
            method: 'find',
            params: {
                contract: 'market',
                table: 'metrics',
                query: { symbol: history.symbol || 'LASSECASH' }
            },
            id: 1
        });

        const metrics = response.data.result && response.data.result[0] ? response.data.result[0] : null;

        if (!metrics) {
            console.error("Could not retrieve live metrics from Hive Engine.");
            return;
        }

        const todayStr = new Date().toISOString().split('T')[0];
        const currentPrice = parseFloat(metrics.lastPrice || 0);
        const currentVolume = parseFloat(metrics.volume || 0);

        // 3. Check if today's entry already exists; if so, update it, otherwise push new
        const lastEntry = history.data_points[history.data_points.length - 1];

        if (lastEntry && lastEntry.date === todayStr) {
            console.log(`Updating existing entry for today (${todayStr})...`);
            lastEntry.price = currentPrice;
            lastEntry.volume = currentVolume;
        } else {
            console.log(`Appending new daily entry for (${todayStr})...`);
            history.data_points.push({
                date: todayStr,
                price: currentPrice,
                volume: currentVolume
            });
        }

        // 4. Save back to file
        fs.writeFileSync(filePath, JSON.stringify(history, null, 2));
        console.log("Successfully updated daily_history.json with latest market stats!");

    } catch (error) {
        console.error("Network or API error during update:", error.message);
    }
}

updateDailyHistory();