import { useMemo } from 'react';
import { useDataStore } from '../store/useDataStore';

export const useValidateData = () => {
    const { rawData, mapping } = useDataStore();

    return useMemo(() => {
        if (!rawData.length || !mapping.date || !mapping.revenue || !mapping.channel) {
            return null;
        }

        // Aggregate data by date for actual vs predicted
        const dateMap = new Map<string, { date: Date; actual: number; predicted: number }>();

        rawData.forEach(row => {
            const dateStr = row[mapping.date!] as string | undefined;
            if (!dateStr) return;
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return;

            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const revenue = parseFloat(String(row[mapping.revenue!] || 0).replace(/[^0-9.-]+/g, '')) || 0;

            if (!dateMap.has(key)) {
                dateMap.set(key, {
                    date: new Date(date.getFullYear(), date.getMonth(), 1),
                    actual: 0,
                    predicted: 0
                });
            }

            const entry = dateMap.get(key)!;
            entry.actual += revenue;
        });

        // Deterministic seeded helper to avoid impure Math.random calls during render
        const seeded = (key: string) => {
            let h = 2166136261 >>> 0;
            for (let i = 0; i < key.length; i++) {
                h = Math.imul(h ^ key.charCodeAt(i), 16777619) >>> 0;
            }
            return (h % 10000) / 10000;
        };

        // Generate mock predictions (in real scenario, this would come from trained model)
        const chartData = Array.from(dateMap.values())
            .sort((a, b) => a.date.getTime() - b.date.getTime())
            .map(d => ({
                ...d,
                // Mock prediction with some noise (±5%) using deterministic seed
                predicted: d.actual * (0.95 + seeded(d.date.toISOString()) * 0.1)
            }));

        // Calculate residuals for residual plot
        const residuals = chartData.map(d => ({
            predicted: d.predicted,
            residual: d.actual - d.predicted
        }));

        // Calculate model metrics
        const actualValues = chartData.map(d => d.actual);
        const mean = actualValues.reduce((sum, val) => sum + val, 0) / actualValues.length;

        // R-Squared
        const ssTotal = actualValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0);
        const ssResidual = chartData.reduce((sum, d) => sum + Math.pow(d.actual - d.predicted, 2), 0);
        const rSquared = 1 - (ssResidual / ssTotal);

        // Adjusted R-Squared (mock - assumes 10 variables)
        const n = chartData.length;
        const k = 10; // number of predictors (mock)
        const adjustedRSquared = 1 - ((1 - rSquared) * (n - 1) / (n - k - 1));

        // MAPE (Mean Absolute Percentage Error)
        const mape = chartData.reduce((sum, d) => {
            return sum + Math.abs((d.actual - d.predicted) / d.actual);
        }, 0) / chartData.length * 100;

        // Durbin-Watson (mock - simplified)
        const durbinWatson = 1.95; // Mock value (should be calculated from residuals)

        // Get unique channels for variable statistics
        const channels = Array.from(
            new Set(rawData.map(row => row[mapping.channel!] as string).filter(Boolean))
        );

        // Mock variable statistics
        const variableStats = channels.map((channel) => ({
            variable: channel,
            coefficient: (seeded(channel + '_coef') * 3000 - 1000).toFixed(2),
            stdError: (seeded(channel + '_se') * 200).toFixed(2),
            tStatistic: (seeded(channel + '_t') * 40 - 5).toFixed(2),
            pValue: seeded(channel + '_p') < 0.7 ? 0.001 : seeded(channel + '_p2') * 0.5,
            vif: (1 + seeded(channel + '_v') * 3).toFixed(2),
            confidence: seeded(channel + '_c') > 0.3 ? 95 : 90
        }));

        return {
            metrics: {
                rSquared,
                adjustedRSquared,
                mape,
                durbinWatson
            },
            chartData,
            residuals,
            variableStats,
            modelInfo: {
                version: 'v2.4',
                status: 'VALIDATED',
                lastUpdated: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            }
        };
    }, [rawData, mapping]);
};
