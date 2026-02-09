import { useState } from 'react';
import { useDataStore } from '../store/useDataStore';

export interface TrainConfig {
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
    const { rawData, mapping } = useDataStore();

    const [config, setConfig] = useState<TrainConfig>({
        trainingWindow: {
            startDate: '',
            endDate: ''
        },
        features: {
            mediaChannels: [],
            organicBaseline: [],
            externalFactors: []
        },
        hyperparameters: {
            adstockDecayMax: 0.7,
            saturationHillMax: 3.0
        }
    });

    // Get available media channels from CSV
    const availableChannels = Array.from(
        new Set(
            rawData
                .map(row => row[mapping.channel!] as string)
                .filter(Boolean)
        )
    );

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
