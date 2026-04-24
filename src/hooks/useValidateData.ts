import { useMemo } from 'react';
import { useDataStore } from '../store/useDataStore';

interface MMMVariableStat {
    variable: string;
    coefficient: number;
    stdError: number;
    tStatistic: number;
    pValue: number;
    vif: number;
    confidence: number;
    status?: string;
}

export interface MMMResults {
    timestamp: string;
    metrics: {
        rSquared: number;
        adjustedRSquared: number;
        mape: number;
        durbinWatson: number;
    };
    chartData: Array<{ date: string; actual: number; predicted: number }>;
    variableStats: MMMVariableStat[];
    modelInfo: {
        version: string;
        status: string;
        lastUpdated: string;
    };
}

export const useValidateData = (options?: { enabled?: boolean }) => {
    const { rawData, mapping } = useDataStore();
    const enabled = options?.enabled ?? true;

    return useMemo(() => {
        if (!enabled) return null;

        if (!rawData.length || !mapping.date || !mapping.revenue || !mapping.channel) {
            return null;
        }

        // --- Mock Logic ---
        
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

        const seeded = (key: string) => {
            let h = 2166136261 >>> 0;
            for (let i = 0; i < key.length; i++) {
                h = Math.imul(h ^ key.charCodeAt(i), 16777619) >>> 0;
            }
            return (h % 10000) / 10000;
        };

        const chartData = Array.from(dateMap.values())
            .sort((a, b) => a.date.getTime() - b.date.getTime())
            .map(d => ({
                ...d,
                predicted: d.actual * (0.95 + seeded(d.date.toISOString()) * 0.1)
            }));

        const residuals = chartData.map(d => ({
            predicted: d.predicted,
            residual: d.actual - d.predicted
        }));

        const actualValues = chartData.map(d => d.actual);
        const mean = actualValues.reduce((sum, val) => sum + val, 0) / actualValues.length;

        const ssTotal = actualValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0);
        const ssResidual = chartData.reduce((sum, d) => sum + Math.pow(d.actual - d.predicted, 2), 0);
        const rSquared = 1 - (ssResidual / ssTotal);

        const n = chartData.length;
        const k = 10; 
        const adjustedRSquared = 1 - ((1 - rSquared) * (n - 1) / (n - k - 1));

        const mape = chartData.reduce((sum, d) => {
            return sum + Math.abs((d.actual - d.predicted) / d.actual);
        }, 0) / chartData.length * 100;

        const durbinWatson = 1.95; 

        const channels = Array.from(
            new Set(rawData.map(row => row[mapping.channel!] as string).filter(Boolean))
        );

        const variableStats = channels.map((channel) => ({
            variable: channel,
            coefficient: Number((seeded(channel + '_coef') * 3000 - 1000).toFixed(2)),
            stdError: Number((seeded(channel + '_se') * 200).toFixed(2)),
            tStatistic: Number((seeded(channel + '_t') * 40 - 5).toFixed(2)),
            pValue: seeded(channel + '_p') < 0.7 ? 0.001 : seeded(channel + '_p2') * 0.5,
            vif: Number((1 + seeded(channel + '_v') * 3).toFixed(2)),
            confidence: seeded(channel + '_c') > 0.3 ? 95 : 90
        })) as MMMVariableStat[];

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
    }, [rawData, mapping, enabled]);
};
