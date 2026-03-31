import axios from 'axios';

const PY_BACKEND_URL = import.meta.env.VITE_PY_BACKEND_URL || 'http://localhost:8000';

export interface MeridianMetricSummary {
    rSquared: number;
    adjustedRSquared: number;
    mape: number;
    durbinWatson: number;
}

export interface MeridianVariableStat {
    variable: string;
    coefficient: number;
    stdError: number;
    tStatistic: number;
    pValue: number;
    vif: number;
    confidence: number;
    status?: string;
}

export interface MeridianResults {
    timestamp: string;
    metrics: MeridianMetricSummary;
    chartData: Array<{ date: string; actual: number; predicted: number }>;
    variableStats: MeridianVariableStat[];
    modelInfo: {
        version: string;
        status: string;
        lastUpdated: string;
    };
}

export const meridianApi = {
    importData: async (file: File): Promise<MeridianResults> => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await axios.post(`${PY_BACKEND_URL}/import`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return response.data.results;
    },

    getLatestResults: async (): Promise<MeridianResults> => {
        const response = await axios.get(`${PY_BACKEND_URL}/results/latest`);
        return response.data;
    },

    trainModel: async () => {
        const response = await axios.post(`${PY_BACKEND_URL}/train`);
        return response.data;
    },

    optimizeBudget: async () => {
        const response = await axios.post(`${PY_BACKEND_URL}/optimize`);
        return response.data;
    }
};
