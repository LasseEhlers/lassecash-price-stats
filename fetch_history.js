const https = require('https');

const data = JSON.stringify({
    jsonrpc: '2.0',
    method: 'find',
    params: {
        contract: 'market',
        table: 'trades',
        query: { symbol: 'LASSECASH' },
        limit: 1000,
        offset: 0,
        sort: { timestamp: 1 }
    },
    id: 1
});

const req = https.request({
    hostname: 'api.hive-engine.com',
    path: '/rpc/markets',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
}, res => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
        try {
            const response = JSON.parse(body);
            console.log("Fetched trades successfully:", response.result ? response.result.length : 0);
            // Here you can parse trades into daily closing candles and save to data/daily_history.json
        } catch (e) {
            console.error("Error parsing response:", e);
        }
    });
});

req.on('error', error => console.error(error));
req.write(data);
req.end();