import { useMemo } from 'react';
import { useDataStore } from '../store/useDataStore';

export interface OptimizationParams {
    totalBudget: number;
    channelWeights: Record<string, number>; // -0.5 to 0.5 (relative change)
}

export const useOptimizeData = (params: OptimizationParams) => {
    const { rawData, mapping } = useDataStore();

    return useMemo(() => {
        if (!rawData.length || !mapping.channel || !mapping.revenue || !mapping.spend) {
            return null;
        }

        // 1. Calculate Current Performance per Channel
        const channelPerf: Record<string, { channel: string; revenue: number; spend: number; roas: number }> = {};

        rawData.forEach(row => {
            const channel = row[mapping.channel!] as string || 'Unknown';
            const revenue = parseFloat(String(row[mapping.revenue!] || 0).replace(/[^0-9.-]+/g, '')) || 0;
            const spend = parseFloat(String(row[mapping.spend!] || 0).replace(/[^0-9.-]+/g, '')) || 0;

            if (!channelPerf[channel]) {
                channelPerf[channel] = { channel, revenue: 0, spend: 0, roas: 0 };
            }

            channelPerf[channel].revenue += revenue;
            channelPerf[channel].spend += spend;
        });

        const channels = Object.values(channelPerf).map(ch => ({
            ...ch,
            roas: ch.spend > 0 ? ch.revenue / ch.spend : 0
        })).sort((a, b) => b.revenue - a.revenue);

        const currentTotalSpend = channels.reduce((sum, ch) => sum + ch.spend, 0);
        const currentTotalRevenue = channels.reduce((sum, ch) => sum + ch.revenue, 0);

        // 2. Simulate Optimization
        // Proportional reallocation logic:
        // New Spend = (Current Share * (1 + weight)) adjusted to fit Total Budget constraint

        // First, calculate raw proposed spends without mutating locals
        const proposedChannels = channels.map(ch => {
            const weight = params.channelWeights[ch.channel] || 0;
            const proposedSpend = ch.spend * (1 + weight);
            return { ...ch, proposedSpend };
        });

        const rawProposedTotal = proposedChannels.reduce((acc, c) => acc + c.proposedSpend, 0);

        // Scale to fit Total Budget
        const scaleFactor = params.totalBudget / (rawProposedTotal || 1);

        const optimizedData = proposedChannels.map(ch => {
            const finalProposedSpend = ch.proposedSpend * scaleFactor;
            // Estimate revenue based on current ROAS (simplification)
            // In real scenarios, diminishing returns curves are used here.
            const estimatedRevenue = finalProposedSpend * ch.roas;
            const delta = finalProposedSpend - ch.spend;

            return {
                ...ch,
                proposedSpend: finalProposedSpend,
                estimatedRevenue,
                delta,
                impact: Math.abs(delta) > ch.spend * 0.1 ? (delta > 0 ? 'High Impact' : 'Med Impact') : 'Low Impact'
            };
        });

        const optimizedTotalRevenue = optimizedData.reduce((sum, ch) => sum + ch.estimatedRevenue, 0);
        const optimizedTotalSpend = optimizedData.reduce((sum, ch) => sum + ch.proposedSpend, 0);
        const optimizedROAS = optimizedTotalRevenue / (optimizedTotalSpend || 1);
        const currentROAS = currentTotalRevenue / (currentTotalSpend || 1);

        // 3. Impact Over Time (Mocked monthly baseline vs optimized)
        const impactTrend = [
            { name: 'Week 1', baseline: currentTotalRevenue / 4, optimized: optimizedTotalRevenue / 4 * 0.95 },
            { name: 'Week 2', baseline: currentTotalRevenue / 4, optimized: optimizedTotalRevenue / 4 * 1.02 },
            { name: 'Week 3', baseline: currentTotalRevenue / 4, optimized: optimizedTotalRevenue / 4 * 1.08 },
            { name: 'Week 4', baseline: currentTotalRevenue / 4, optimized: optimizedTotalRevenue / 4 * 1.15 },
        ];

        return {
            metrics: {
                projectedRevenue: optimizedTotalRevenue,
                projectedRevenueLift: ((optimizedTotalRevenue - currentTotalRevenue) / currentTotalRevenue) * 100,
                baselineRevenue: currentTotalRevenue,
                estROAS: optimizedROAS,
                roasDelta: optimizedROAS - currentROAS,
                forecastCPA: optimizedTotalSpend / (optimizedTotalRevenue * 0.1 || 1), // Mock CPA logic
                cpaTrend: 2.1
            },
            channels: optimizedData,
            impactTrend
        };

    }, [rawData, mapping, params]);
};
