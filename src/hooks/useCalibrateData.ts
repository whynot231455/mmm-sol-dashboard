import { useMemo, useState } from 'react';
import { useDataStore } from '../store/useDataStore';

export interface CalibrationMetric {
  name: string;
  original: number;
  calibrated: number;
  change: number;
  baselineSales?: number;
  totalMediaImpact?: number;
  roiDelta?: number;
  modelFit?: number;
  mape?: number;
}

export interface CoefficientChange {
  channel: string;
  original: number;
  calibrated: number;
  change: number;
  baselineCoeff?: number;
  calibratedCoeff?: number;
  impact?: number;
}

export interface LiftStudy {
  id: string;
  name: string;
  status: 'active' | 'pending' | 'completed';
  startDate: string;
  endDate: string;
  lift: number;
  confidence: number;
  source?: string;
  date?: string;
  enabled?: boolean;
}

// Use LiftStudy directly or add unique fields to ActiveStudy if needed
export type ActiveStudy = LiftStudy;

export interface TuningParams {
  saturation: number;
  curvature: number;
  adstock: number;
  calibrationStrength: number;
  setCalibrationStrength: (value: number) => void;
  priorWeight: number;
  setPriorWeight: (value: number) => void;
}

export interface CalibrationMetrics {
  baselineSales: number;
  totalMediaImpact: number;
  roiDelta: number;
  modelFit: number;
  mape: number;
}

export interface CalibrateData {
  metrics: CalibrationMetrics;
  channelMetrics: CalibrationMetric[];
  impactData: { channel: string; baseline: number; calibrated: number; actuals: number }[];
  coefficientChanges: CoefficientChange[];
  activeStudies: ActiveStudy[];
  toggleStudy: (id: string) => void;
  tuningParams: TuningParams;
  setTuningParams: (params: Partial<TuningParams>) => void;
}

const pseudoRandom = (seed: string) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash % 1000) / 1000;
};

export const useCalibrateData = (): CalibrateData | null => {
  const { rawData, mapping, isLoaded } = useDataStore();

  const [tuningParamsState, setTuningParamsState] = useState({
    calibrationStrength: 0.5,
    priorWeight: 0.5,
    saturation: 0.7,
    curvature: 0.5,
    adstock: 0.3,
  });

  const data = useMemo(() => {
    if (!isLoaded || !rawData.length || !mapping.revenue || !mapping.spend) {
      return null;
    }

    const channels = new Set<string>();
    rawData.forEach(row => {
      if (mapping.channel) {
        channels.add(row[mapping.channel] as string);
      }
    });

    const channelArray = Array.from(channels);

    const channelMetrics: CalibrationMetric[] = channelArray.map(channel => ({
      name: channel,
      original: pseudoRandom(channel + 'orig') * 2 + 0.5,
      calibrated: pseudoRandom(channel + 'cal') * 2 + 0.5,
      change: (pseudoRandom(channel + 'chg') - 0.5) * 0.4,
    }));

    const metrics: CalibrationMetrics = {
        baselineSales: 125400,
        totalMediaImpact: 84200,
        roiDelta: 14.2,
        modelFit: 0.924,
        mape: 4.8,
    };

    const impactData: { channel: string; baseline: number; calibrated: number; actuals: number }[] = channelArray.map(channel => ({
      channel,
      baseline: pseudoRandom(channel + 'base') * 10000 + 5000,
      calibrated: pseudoRandom(channel + 'cal2') * 10000 + 5000,
      actuals: pseudoRandom(channel + 'act') * 10000 + 5000,
    }));

    const coefficientChanges: CoefficientChange[] = channelArray.map(channel => ({
      channel,
      original: pseudoRandom(channel + 'coef1') * 0.5 + 0.1,
      calibrated: pseudoRandom(channel + 'coef2') * 0.5 + 0.1,
      change: (pseudoRandom(channel + 'coef3') - 0.5) * 0.2,
      baselineCoeff: pseudoRandom(channel + 'coef4') * 0.5 + 0.1,
      calibratedCoeff: pseudoRandom(channel + 'coef5') * 0.5 + 0.1,
      impact: pseudoRandom(channel + 'coef6') * 5000,
    }));

    const activeStudies: ActiveStudy[] = [
      {
        id: '1',
        name: 'FB Q1 Study',
        status: 'active',
        startDate: '2024-01-01',
        endDate: '2024-03-31',
        lift: 0.15,
        confidence: 0.92,
        source: 'Facebook',
        date: '2024-03-31',
        enabled: true,
      },
    ];

    const toggleStudy = () => {};

    const tuningParams: TuningParams = {
      ...tuningParamsState,
      setCalibrationStrength: (value: number) => setTuningParamsState(prev => ({ ...prev, calibrationStrength: value })),
      setPriorWeight: (value: number) => setTuningParamsState(prev => ({ ...prev, priorWeight: value })),
    };

    const setTuningParams = (params: Partial<TuningParams>) => {
        setTuningParamsState(prev => ({ ...prev, ...params }));
    };

    return {
      metrics,
      channelMetrics,
      impactData,
      coefficientChanges,
      activeStudies,
      toggleStudy,
      tuningParams,
      setTuningParams,
    };
  }, [rawData, mapping, isLoaded, tuningParamsState]);

  return data;
};