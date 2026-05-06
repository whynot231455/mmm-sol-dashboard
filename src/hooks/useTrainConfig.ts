import { useMemo, useState, useEffect } from 'react';
import { useDataStore } from '../store/useDataStore';

interface TrainConfigFeatures {
  mediaChannels: string[];
  organicBaseline: string[];
  externalFactors: string[];
}

interface TrainConfig {
  trainingWindow: {
    startDate: string;
    endDate: string;
  };
  targetVariable: string;
  modelType: string;
  trainTestRatio: string;
  features: TrainConfigFeatures;
  hyperparameters: {
    adstockDecayMax: number;
    saturationHillMax: number;
    regularization: number;
    learningRate: number;
    iterations: number;
  };
}

interface TrainMetrics {
  r2: number;
  rmse: number;
  mae: number;
  mape: number;
  totalVariables: number;
  missingValues: number;
  estimatedRuntime: number;
  isReady: boolean;
}

interface DateConstraint {
  min: string;
  max: string;
}

interface TrainConfigData {
  config: TrainConfig;
  setConfig: (config: Partial<TrainConfig> | ((prev: TrainConfig) => TrainConfig)) => void;
  headers: string[];
  dateConstraints: DateConstraint;
  availableChannels: string[];
  organicBaselineOptions: string[];
  externalFactorOptions: string[];
  metrics: TrainMetrics;
}

export const useTrainConfig = (): TrainConfigData => {
  const { rawData, headers: storeHeaders, mapping, isLoaded } = useDataStore();

  const [config, setInternalConfig] = useState<TrainConfig>({
    trainingWindow: {
      startDate: '',
      endDate: '',
    },
    targetVariable: 'Revenue',
    modelType: 'Bayesian Modeling',
    trainTestRatio: '80/20',
    features: {
      mediaChannels: [],
      organicBaseline: [],
      externalFactors: [],
    },
    hyperparameters: {
      adstockDecayMax: 0.8,
      saturationHillMax: 3.5,
      regularization: 0.1,
      learningRate: 0.01,
      iterations: 1000,
    },
  });

  // Initialize config when data is loaded
  useEffect(() => {
    if (isLoaded && rawData.length > 0 && !config.trainingWindow.startDate) {
      const dates: string[] = [];
      const channelsSet = new Set<string>();

      rawData.forEach((row) => {
        if (mapping.date) {
          dates.push(row[mapping.date] as string);
        }
        if (mapping.channel) {
          channelsSet.add(row[mapping.channel] as string);
        }
      });

      const sortedDates = [...new Set(dates)].sort();
      const availableChannels = Array.from(channelsSet);
      
      setInternalConfig(prev => ({
        ...prev,
        trainingWindow: sortedDates.length > 0 ? {
          startDate: sortedDates[0],
          endDate: sortedDates[Math.floor(sortedDates.length * 0.8)],
        } : prev.trainingWindow,
        features: {
          ...prev.features,
          mediaChannels: availableChannels,
        },
        targetVariable: mapping.revenue || 'Revenue',
      }));
    }
  }, [isLoaded, rawData, mapping, config.trainingWindow.startDate]);

  const { headers, dateConstraints, availableChannels, organicBaselineOptions, externalFactorOptions, metrics } = useMemo(() => {
    let headers: string[] = [];
    let dateConstraints: DateConstraint = { min: '', max: '' };
    let availableChannels: string[] = [];
    let organicBaselineOptions: string[] = ['Base', 'Trend', 'Seasonality'];
    let externalFactorOptions: string[] = ['Holiday', 'Events', 'Competitor'];
    let metrics: TrainMetrics = {
        r2: 0,
        rmse: 0,
        mae: 0,
        mape: 0,
        totalVariables: 0,
        missingValues: 0,
        estimatedRuntime: 0,
        isReady: false,
    };

    if (isLoaded && rawData.length > 0) {
      headers = storeHeaders;

      const dates: string[] = [];
      const channelsSet = new Set<string>();

      rawData.forEach((row) => {
        if (mapping.date) {
          dates.push(row[mapping.date] as string);
        }
        if (mapping.channel) {
          channelsSet.add(row[mapping.channel] as string);
        }
      });

      const sortedDates = [...new Set(dates)].sort();
      if (sortedDates.length > 0) {
        dateConstraints = {
          min: sortedDates[0],
          max: sortedDates[sortedDates.length - 1],
        };
      }

      availableChannels = Array.from(channelsSet);

      metrics = {
        r2: 0.85,
        rmse: 1200,
        mae: 890,
        mape: 12.5,
        totalVariables: availableChannels.length + organicBaselineOptions.length + externalFactorOptions.length,
        missingValues: 0,
        estimatedRuntime: 30,
        isReady: true,
      };
    }

    return {
      headers,
      dateConstraints,
      availableChannels,
      organicBaselineOptions,
      externalFactorOptions,
      metrics,
    };
  }, [rawData, storeHeaders, mapping, isLoaded]);

  const setConfig = (newConfig: Partial<TrainConfig> | ((prev: TrainConfig) => TrainConfig)) => {
    if (typeof newConfig === 'function') {
      setInternalConfig(newConfig);
    } else {
      setInternalConfig(prev => {
        const updated = { ...prev, ...newConfig };
        // Deep merge for hyperparameters if they exist in newConfig
        if (newConfig.hyperparameters) {
          updated.hyperparameters = { ...prev.hyperparameters, ...newConfig.hyperparameters };
        }
        // Deep merge for features if they exist in newConfig
        if (newConfig.features) {
          updated.features = { ...prev.features, ...newConfig.features };
        }
        // Deep merge for trainingWindow if it exists in newConfig
        if (newConfig.trainingWindow) {
          updated.trainingWindow = { ...prev.trainingWindow, ...newConfig.trainingWindow };
        }
        return updated;
      });
    }
  };

  return {
    config,
    setConfig,
    headers,
    dateConstraints,
    availableChannels,
    organicBaselineOptions,
    externalFactorOptions,
    metrics,
  };
};