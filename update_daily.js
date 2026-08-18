const fs = require('fs');
const path = require('path');
const axios = require('axios');

const SYMBOL = 'LASSECASH';
const filePath = path.join(__dirname, 'data', 'daily_history.json');

const RPC_NODES = [
    'https://api.hive-engine.com/rpc/contracts',
    'https://engine.rishipanthee.com/rpc/contracts',
    'https://api.primersion.com/rpc/contracts'
];

async function fetchLiveMetrics() {
    for (const node of RPC_NODES) {
        try {
            const response = await axios.post(node, {
                jsonrpc: '2.0',
                method: 'find',
                params: {
                    contract: 'market',
                    table: 'metrics',
                    query: { symbol: SYMBOL }
                },
                id: 1
            }, { timeout: 8000 });

            const metrics = response.data?.result?.[0];
            if (metrics) {
                return {
                    price: parseFloat(metrics.lastPrice || 0),
                    volume: parseFloat(metrics.volume || 0)
                };
            }
        } catch (err) {
            // Try next backup node
        }
    }
    return null;
}

async function runDailyUpdate() {
    if (!fs.existsSync(filePath)) return;

    let history;
    try {
        history = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
        return;
    }

    const liveData = await fetchLiveMetrics();
    if (!liveData) return;

    const { price: currentPrice, volume: currentVolume } = liveData;
    const todayStr = new Date().toISOString().split('T')[0];
    let dataPoints = history.data_points;

    if (dataPoints.length > 0) {
        const lastEntry = dataPoints[dataPoints.length - 1];
        const lastDate = new Date(lastEntry.date);
        const todayDate = new Date(todayStr);

        let gapDate = new Date(lastDate);
        gapDate.setDate(gapDate.getDate() + 1);

        // Fill any missed gap days automatically
        while (gapDate < todayDate) {
            const gapDateStr = gapDate.toISOString().split('T')[0];
            dataPoints.push({
                date: gapDateStr,
                price: lastEntry.price,
                volume: 0
            });
            gapDate.setDate(gapDate.getDate() + 1);
        }

        const latestPoint = dataPoints[dataPoints.length - 1];
        if (latestPoint && latestPoint.date === todayStr) {
            latestPoint.price = currentPrice;
            latestPoint.volume = currentVolume;
        } else {
            dataPoints.push({
                date: todayStr,
                price: currentPrice,
                volume: currentVolume
            });
        }
    }

    history.data_points = dataPoints;
    fs.writeFileSync(filePath, JSON.stringify(history, null, 2));
    console.log(`Successfully updated daily_history.json locally for ${todayStr}`);
}

runDailyUpdate();