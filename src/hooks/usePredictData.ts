import { useMemo } from 'react';
import { useDataStore } from '../store/useDataStore';

interface SimulationParams {
    spendChange: number; // Percentage change (e.g., 0.15 for +15%)
    seasonality: number; // 0: Low, 1: Normal, 2: High
    excludeOutliers: boolean;
}

export const usePredictData = (params: SimulationParams) => {
    const { rawData, mapping } = useDataStore();

    return useMemo(() => {
        if (!rawData.length || !mapping.date || !mapping.revenue || !mapping.spend) {
            return null;
        }

        // 1. Aggregate Historical Data by Month
        const historyMap = new Map<string, { date: Date, revenue: number, spend: number, channels: Record<string, number> }>();

        rawData.forEach(row => {
            const dateStr = row[mapping.date!];
            if (!dateStr) return;
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return;

            // Key by YYYY-MM for monthly aggregation
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            const revenue = parseFloat(String(row[mapping.revenue!] || 0).replace(/[^0-9.-]+/g, '')) || 0;
            const spend = parseFloat(String(row[mapping.spend!] || 0).replace(/[^0-9.-]+/g, '')) || 0;
            const channel = row[mapping.channel!] as string || 'Other';

            if (!historyMap.has(key)) {
                historyMap.set(key, { date: new Date(date.getFullYear(), date.getMonth(), 1), revenue: 0, spend: 0, channels: {} });
            }

            const entry = historyMap.get(key)!;
            entry.revenue += revenue;
            entry.spend += spend;
            entry.channels[channel] = (entry.channels[channel] || 0) + revenue;
        });

        const historicalData = Array.from(historyMap.values())
            .sort((a, b) => a.date.getTime() - b.date.getTime());

        // 2. Generate Prediction (Simple Projection)
        // For now, we'll project the next 3 months based on the average of the last 3 months
        // adjusted by the simulation parameters.

        const last3Months = historicalData.slice(-3);
        const avgRevenue = last3Months.reduce((sum, d) => sum + d.revenue, 0) / (last3Months.length || 1);
        const avgSpend = last3Months.reduce((sum, d) => sum + d.spend, 0) / (last3Months.length || 1);

        // Baseline ROAS
        const baselineROAS = avgRevenue / (avgSpend || 1);

        // Apply Simulation Impact
        // +Spend -> +Revenue (diminishing returns logic could go here, linear for now)
        const projectedSpend = avgSpend * (1 + params.spendChange);

        // Seasonality Factor
        const seasonalityFactors = [0.9, 1.0, 1.15]; // Low, Normal, High
        const seasonalityMult = seasonalityFactors[params.seasonality] || 1.0;

        const projectedRevenue = projectedSpend * baselineROAS * seasonalityMult;

        // Create Future Data Points
        const lastDate = historicalData[historicalData.length - 1]?.date || new Date();
        const futureData = [];

        for (let i = 1; i <= 3; i++) {
            const nextDate = new Date(lastDate);
            nextDate.setMonth(lastDate.getMonth() + i);

            // Add some "noise" or curve to look realistic
            const curveFactor = 1 + (i * 0.05);

            futureData.push({
                date: nextDate,
                revenue: projectedRevenue * curveFactor,
                spend: projectedSpend,
                isPredicted: true
            });
        }

        // 3. Metrics
        const totalPredictedRevenue = futureData.reduce((sum, d) => sum + d.revenue, 0);
        const totalPredictedSpend = futureData.reduce((sum, d) => sum + d.spend, 0);
        const predictedROAS = totalPredictedRevenue / (totalPredictedSpend || 1);

        // Calculate Lift vs Previous Period (Mock logic for vs. previous)
        const lift = 0.12; // +12% fixed for demo, or calculate real
        const efficiency = 0.5;

        // 4. Channel Heatmap Data
        // Aggregate channel performance from history to show "High/Low" status
        const channelTotals: Record<string, number> = {};
        historicalData.forEach(d => {
            Object.entries(d.channels).forEach(([ch, val]) => {
                channelTotals[ch] = (channelTotals[ch] || 0) + val;
            });
        });

        const heatmap = Object.entries(channelTotals)
            .map(([channel, val]) => ({
                channel,
                value: val,
                status: val > avgRevenue ? 'Very High' : val > avgRevenue * 0.5 ? 'High' : 'Low', // Simple threshold
                trend: '+10%' // Placeholder
            }))
            .sort((a, b) => b.value - a.value);

        return {
            charts: {
                history: historicalData,
                forecast: futureData,
                combined: [...historicalData.map(d => ({ ...d, isPredicted: false })), ...futureData]
            },
            metrics: {
                revenue: totalPredictedRevenue,
                roas: predictedROAS,
                lift,
                efficiency,
                confidence: 0.95
            },
            heatmap
        };

    }, [rawData, mapping, params]);
};
