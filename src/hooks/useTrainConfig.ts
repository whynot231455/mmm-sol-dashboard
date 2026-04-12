import { useState, useMemo, useEffect } from 'react';
import { useDataStore } from '../store/useDataStore';

export interface TrainConfig {
    targetVariable: string;
    trainTestRatio: string;
    modelType: string;
    trainingWindow: {
        startDate: string;
        endDate: string;
    };
    features: {
        mediaChannels: string[];
        organicBaseline: string[];
        externalFactors: string[];
    };
    hyperparameters: {
        adstockDecayMax: number;
        saturationHillMax: number;
    };
}

export const useTrainConfig = () => {
    const { rawData, mapping, headers } = useDataStore();

    // Get available media channels from CSV
    const availableChannels = Array.from(
        new Set(
            rawData
                .map(row => row[mapping.channel!] as string)
                .filter(Boolean)
        )
    );

    // Extract date range from raw data
    const dateConstraints = useMemo(() => {
        if (!rawData || !mapping.date) return { min: '', max: '' };
        
        const dates = rawData
            .map(row => {
                const val = row[mapping.date!] as string;
                if (!val) return null;
                const d = new Date(val);
                return isNaN(d.getTime()) ? null : d;
            })
            .filter((d): d is Date => d !== null);

        if (dates.length === 0) return { min: '', max: '' };

        const min = new Date(Math.min(...dates.map(d => d.getTime())));
        const max = new Date(Math.max(...dates.map(d => d.getTime())));

        const formatDate = (date: Date) => {
            return date.toISOString().split('T')[0];
        };

        return {
            min: formatDate(min),
            max: formatDate(max)
        };
    }, [rawData, mapping.date]);

    const [config, setConfig] = useState<TrainConfig>({
        targetVariable: mapping.revenue || '',
        trainTestRatio: '80/20',
        modelType: 'Bayesian (Meridian)',
        trainingWindow: {
            startDate: dateConstraints.min,
            endDate: dateConstraints.max
        },
        features: {
            mediaChannels: availableChannels, // Auto-select all available channels
            organicBaseline: [],
            externalFactors: []
        },
        hyperparameters: {
            adstockDecayMax: 0.7,
            saturationHillMax: 3.0
        }
    });

    // Update training window defaults when dateConstraints are loaded/changed
    useEffect(() => {
        if (dateConstraints.min && dateConstraints.max) {
            setConfig(prev => {
                // Only auto-fill if currently empty to avoid overwriting user edits
                if (!prev.trainingWindow.startDate || !prev.trainingWindow.endDate) {
                    return {
                        ...prev,
                        trainingWindow: {
                            startDate: prev.trainingWindow.startDate || dateConstraints.min,
                            endDate: prev.trainingWindow.endDate || dateConstraints.max
                        }
                    };
                }
                return prev;
            });
        }
    }, [dateConstraints]);

    // Mock organic baseline and external factors
    const organicBaselineOptions = ['Seasonality', 'Trend', 'Holidays'];
    const externalFactorOptions = ['Competitor Pricing', 'Consumer Confidence', 'Unemployment Rate'];

    // Calculate pre-flight metrics
    const totalVariables =
        config.features.mediaChannels.length +
        config.features.organicBaseline.length +
        config.features.externalFactors.length;

    const missingValues = rawData.filter(row =>
        Object.values(row).some(val => !val || val === '')
    ).length;

    const estimatedRuntime = Math.max(1, Math.ceil(totalVariables * 0.3)); // Mock calculation

    const isReady: boolean = Boolean(
        config.trainingWindow.startDate &&
        config.trainingWindow.endDate &&
        totalVariables > 0
    );

    return {
        config,
        setConfig,
        headers,
        dateConstraints,
        availableChannels,
        organicBaselineOptions,
        externalFactorOptions,
        metrics: {
            totalVariables,
            missingValues,
            estimatedRuntime,
            isReady
        }
    };
};
