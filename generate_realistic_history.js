const fs = require('fs');
const path = require('path');

const SYMBOL = 'LASSECASH';
const INCEPTION_DATE = new Date('2019-06-28');
const TODAY = new Date();

function buildRealisticHistory() {
    console.log(`Generating realistic fluctuating price history for ${SYMBOL}...`);
    let dataPoints = [];
    let currentDate = new Date(INCEPTION_DATE);
    
    // Starting baseline price at launch in 2019
    let currentPrice = 0.0010;

    while (currentDate <= TODAY) {
        const dateStr = currentDate.toISOString().split('T')[0];
        
        // Add realistic daily random walk / market volatility (-4% to +4.2%)
        const randomChange = (Math.random() - 0.48) * 0.0004;
        currentPrice = Math.max(0.0001, currentPrice + randomChange);
        
        // Simulate a minor bull run peak around late 2021
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        if (year === 2021 && month >= 9 && month <= 11) {
            currentPrice += 0.0002;
        }

        dataPoints.push({
            date: dateStr,
            price: parseFloat(currentPrice.toFixed(6)),
            volume: Math.floor(Math.random() * 25000) + 500
        });

        currentDate.setDate(currentDate.getDate() + 1);
    }

    const outputObj = {
        symbol: SYMBOL,
        inception: "2019-06-28",
        data_points: dataPoints
    };

    const targetDir = path.join(__dirname, 'data');
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }

    const filePath = path.join(targetDir, 'daily_history.json');
    fs.writeFileSync(filePath, JSON.stringify(outputObj, null, 2));
    console.log(`Successfully generated ${dataPoints.length} days of dynamic price points!`);
}

buildRealisticHistory();
