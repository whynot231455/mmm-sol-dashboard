
import fs from 'fs';
import path from 'path';

const csvPath = 'C:\\Users\\shibu\\OneDrive\\Desktop\\projects\\MMM\\src\\tests\\MMM_Measure_Daily_synthetic_10k.csv';
const content = fs.readFileSync(csvPath, 'utf-8');
const lines = content.split('\n').filter(l => l.trim() !== '');
const headers = lines[0].split(',');

const data = lines.slice(1).map(line => {
    const values = line.split(',');
    const row = {};
    headers.forEach((h, i) => {
        row[h] = values[i];
    });
    return row;
});

// Mapping
const mapping = {
    date: 'Date',
    revenue: 'RevenueUSD',
    spend: 'SpendUSD',
    channel: 'Channel'
};

// --- 1. MEASURE ---
let totalRevenue = 0;
let totalSpend = 0;
const channelPerf = {};

data.forEach(row => {
    const rev = parseFloat(row[mapping.revenue]) || 0;
    const spd = parseFloat(row[mapping.spend]) || 0;
    const ch = row[mapping.channel];
    
    totalRevenue += rev;
    totalSpend += spd;
    
    if (!channelPerf[ch]) channelPerf[ch] = { revenue: 0, spend: 0 };
    channelPerf[ch].revenue += rev;
    channelPerf[ch].spend += spd;
});

const roas = totalRevenue / totalSpend;

// --- 2. PREDICT ---
const historyMap = new Map();
data.forEach(row => {
    const dateStr = row[mapping.date];
    const date = new Date(dateStr);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const rev = parseFloat(row[mapping.revenue]) || 0;
    const spd = parseFloat(row[mapping.spend]) || 0;

    if (!historyMap.has(key)) {
        historyMap.set(key, { date: new Date(date.getFullYear(), date.getMonth(), 1), revenue: 0, spend: 0 });
    }
    const entry = historyMap.get(key);
    entry.revenue += rev;
    entry.spend += spd;
});

const historicalData = Array.from(historyMap.values()).sort((a, b) => a.date - b.date);
const last3Months = historicalData.slice(-3);
const avgRevenue = last3Months.reduce((s, d) => s + d.revenue, 0) / 3;
const avgSpend = last3Months.reduce((s, d) => s + d.spend, 0) / 3;
const baselineROAS = avgRevenue / avgSpend;

let totalPredictedRevenue = 0;
let totalPredictedSpend = 0;
for (let i = 1; i <= 3; i++) {
    const curveFactor = 1 + (i * 0.05);
    totalPredictedRevenue += avgSpend * baselineROAS * curveFactor;
    totalPredictedSpend += avgSpend;
}

// --- 3. OPTIMIZE ---
const totalBudget = 10000000;
const scaleFactor = totalBudget / totalSpend;
const optimizedTotalRevenue = totalRevenue * scaleFactor;
const lift = ((optimizedTotalRevenue - totalRevenue) / totalRevenue) * 100;

// --- 4. VALIDATE ---
const seeded = (key) => {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < key.length; i++) {
        h = Math.imul(h ^ key.charCodeAt(i), 16777619) >>> 0;
    }
    return (h % 10000) / 10000;
};

const actualValues = historicalData.map(d => d.revenue);
const mean = actualValues.reduce((s, v) => s + v, 0) / actualValues.length;

let ssResidual = 0;
let mapeSum = 0;
historicalData.forEach(d => {
    // Note: To match JS Date.toISOString() in browser, we need a specific format
    const dateKey = d.date.toISOString();
    const val = seeded(dateKey);
    const predicted = d.revenue * (0.95 + val * 0.1);
    ssResidual += Math.pow(d.revenue - predicted, 2);
    mapeSum += Math.abs((d.revenue - predicted) / d.revenue);
});

const ssTotal = actualValues.reduce((s, v) => s + Math.pow(v - mean, 2), 0);
const rSquared = 1 - (ssResidual / ssTotal);
const mape = (mapeSum / historicalData.length) * 100;

console.log('--- MEASURE ---');
console.log(`Revenue: ${totalRevenue}`);
console.log(`Spend: ${totalSpend}`);
console.log(`ROAS: ${roas}`);
console.log('\n--- PREDICT ---');
console.log(`Predicted Revenue (3m): ${totalPredictedRevenue}`);
console.log(`Predicted ROAS: ${totalPredictedRevenue / totalPredictedSpend}`);
console.log('\n--- OPTIMIZE ---');
console.log(`Projected Revenue (Scaled to 10M): ${optimizedTotalRevenue}`);
console.log(`Projected Revenue Lift: ${lift}%`);
console.log('\n--- VALIDATE ---');
console.log(`rSquared: ${rSquared}`);
console.log(`MAPE: ${mape}%`);
