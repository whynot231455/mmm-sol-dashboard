import { useMemo } from 'react';
import { useDataStore } from '../store/useDataStore';

export interface GeoRegion {
  id: string;
  name: string;
  country: string;
  group: 'treatment' | 'control' | 'unassigned';
  population: number;
  spend: number;
  similarity: number;
  avgRevenue: number;
}

export interface PowerAnalysisPoint {
  preTestPeriodWeeks: number;
  testPeriodWeeks: number;
  minDetectableEffect: number;
  power: number;
  power95: number;
  weeks: number;
}

export interface GeoLiftTest {
  id: string;
  name: string;
  status: 'draft' | 'scheduled' | 'active' | 'completed';
  startDate: string;
  endDate: string;
  regions: GeoRegion[];
  kpi: string;
  budget: number;
  channel?: string;
  lift?: number;
}

export interface MonitorDataPoint {
  date: string;
  treatment: number;
  control: number;
}

export interface RegionPerformance {
  regionId: string;
  regionName: string;
  revenue: number;
  spend: number;
  roi: number;
  region: string;
  group: 'treatment' | 'control' | 'unassigned';
  lift: number;
}

export interface TestConfig {
  testId: string;
  testName: string;
  preTestWeeks: number;
  testWeeks: number;
  minEffect: number;
  confidence: number;
  status: 'draft' | 'scheduled' | 'active' | 'completed';
  startDate: string;
  endDate: string;
  channel: string;
  kpi: string;
  budget: number;
  durationWeeks: number;
}

export interface LiftResult {
  id: string;
  testId: string;
  lift: number;
  confidence: number;
  pValue: number;
  standardError: number;
  liftPercent: number;
  confidenceInterval: [number, number];
  incrementalRevenue: number;
  testSpend: number;
  incrementalROAS: number;
}

export interface ChannelComparison {
  channel: string;
  treatmentLift: number;
  controlLift: number;
  incremental: number;
  geoLiftROAS?: number;
  mmmROAS?: number;
  delta?: number;
}

export interface CounterfactualPoint {
  date: string;
  actual: number;
  counterfactual: number;
  liftArea: number;
}

interface GeoLiftData {
  tests: GeoLiftTest[];
  regions: GeoRegion[];
  powerAnalysis: PowerAnalysisPoint[];
  activeTest: GeoLiftTest | null;
  pastTests: GeoLiftTest[];
  monitorData: MonitorDataPoint[];
  regionPerformance: RegionPerformance[];
  testConfig: TestConfig;
  liftResult: LiftResult;
  channelComparison: ChannelComparison[];
  counterfactualData: CounterfactualPoint[];
  createTest: (test: Omit<GeoLiftTest, 'id'>) => void;
  updateTest: (id: string, updates: Partial<GeoLiftTest>) => void;
  deleteTest: (id: string) => void;
}

const pseudoRandom = (seed: string) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash % 1000) / 1000;
};

export const useGeoLiftData = (): GeoLiftData => {
  const { rawData, mapping } = useDataStore();

  const data = useMemo(() => {
    const tests: GeoLiftTest[] = [];
    const regionMap = new Map<string, GeoRegion>();

    rawData.forEach((row) => {
      const country = mapping.country ? (row[mapping.country] as string) : undefined;
      const spend = mapping.spend ? parseFloat(String(row[mapping.spend] || 0)) : 0;
      const revenue = mapping.revenue ? parseFloat(String(row[mapping.revenue] || 0)) : 0;

      if (country && !regionMap.has(country)) {
        regionMap.set(country, {
          id: country,
          name: country,
          country: country,
          group: 'unassigned',
          population: Math.floor(pseudoRandom(country) * 5000000) + 1000000,
          spend: 0,
          similarity: pseudoRandom(country + 'sim'),
          avgRevenue: 0,
        });
      }

      const region = regionMap.get(country!);
      if (region) {
        region.spend += spend;
        region.avgRevenue = (region.avgRevenue || 0) + revenue;
      }
    });

    const regions = Array.from(regionMap.values());

    const powerAnalysis: PowerAnalysisPoint[] = [];
    for (let i = 4; i <= 12; i += 2) {
      powerAnalysis.push({
        preTestPeriodWeeks: i,
        testPeriodWeeks: 8,
        minDetectableEffect: 5 + (i * 0.5),
        power: Math.min(0.95, 0.5 + (i * 0.04)),
        power95: Math.min(0.95, 0.5 + (i * 0.04)),
        weeks: 8,
      });
    }

    const pastTests: GeoLiftTest[] = [];
    const monitorData: MonitorDataPoint[] = [];
    const regionPerformance: RegionPerformance[] = [];
    
    // Populate monitor data for 8 weeks (56 days)
    for (let i = 0; i < 56; i++) {
        const d = new Date('2024-04-01');
        d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        // Create an increasing gap between treatment and control over time
        const dayProgress = i / 56;
        const controlValue = 15000 + pseudoRandom(dateStr + 'ctrl') * 5000;
        // Treatment gets progressively better than control (up to 12.4% lift average)
        const treatmentLift = 1 + (dayProgress * 0.25);
        const treatmentValue = controlValue * treatmentLift + (pseudoRandom(dateStr + 'trt') * 2000 - 1000);
        
        monitorData.push({
            date: dateStr,
            treatment: treatmentValue,
            control: controlValue,
        });
    }

    // Populate region performance based on regions if available, or generate dummy regions
    if (regions.length > 0) {
        regions.forEach((r, idx) => {
            const isTreatment = idx % 2 === 0;
            const revenue = r.avgRevenue || (isTreatment ? 850000 : 750000);
            const spend = r.spend || (isTreatment ? 25000 : 0);
            regionPerformance.push({
                regionId: r.id,
                regionName: r.name,
                region: r.name,
                revenue,
                spend,
                roi: spend > 0 ? revenue / spend : 0,
                group: isTreatment ? 'treatment' : 'control',
                lift: isTreatment ? 12.4 + (pseudoRandom(r.name) * 5 - 2.5) : 0,
            });
        });
    } else {
        // Fallback dummy regions
        ['New York', 'California', 'Texas', 'Florida'].forEach((name, idx) => {
            const isTreatment = idx % 2 === 0;
            const revenue = isTreatment ? 850000 : 750000;
            const spend = isTreatment ? 25000 : 0;
            regionPerformance.push({
                regionId: name,
                regionName: name,
                region: name,
                revenue,
                spend,
                roi: spend > 0 ? revenue / spend : 0,
                group: isTreatment ? 'treatment' : 'control',
                lift: isTreatment ? 12.4 + (pseudoRandom(name) * 5 - 2.5) : 0,
            });
        });
    }

    const testConfig: TestConfig = {
      testId: 'test-1',
      testName: 'Brand Lift Experiment Q2',
      preTestWeeks: 4,
      testWeeks: 8,
      minEffect: 0.05,
      confidence: 0.87,
      status: 'active',
      startDate: '2024-04-01',
      endDate: '2024-05-26',
      channel: 'Meta Ads',
      kpi: 'Revenue',
      budget: 50000,
      durationWeeks: 8,
    };
    const liftResult: LiftResult = {
      id: 'res-1',
      testId: 'test-1',
      lift: 12.4,
      confidence: 0.87,
      pValue: 0.02,
      standardError: 0.035,
      liftPercent: 12.4,
      confidenceInterval: [8.2, 16.6],
      incrementalRevenue: 45000,
      testSpend: 50000,
      incrementalROAS: 0.9,
    };
    const channelComparison: ChannelComparison[] = [
      { channel: 'Meta Ads', treatmentLift: 0.15, controlLift: 0.02, incremental: 12.4, geoLiftROAS: 2.4, mmmROAS: 2.1, delta: 14.2 },
      { channel: 'Google Search', treatmentLift: 0.12, controlLift: 0.03, incremental: 8.7, geoLiftROAS: 3.1, mmmROAS: 3.4, delta: -8.8 },
    ];
    const counterfactualData: CounterfactualPoint[] = [];
    for (let i = 0; i < 30; i++) {
        const d = new Date('2024-04-01');
        d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        counterfactualData.push({
            date: dateStr,
            actual: 1000 + pseudoRandom(dateStr + 'act') * 200,
            counterfactual: 900 + pseudoRandom(dateStr + 'cf') * 150,
            liftArea: 100
        });
    }

    return {
      tests,
      regions,
      powerAnalysis,
      activeTest: null as GeoLiftTest | null,
      pastTests,
      monitorData,
      regionPerformance,
      testConfig,
      liftResult,
      channelComparison,
      counterfactualData,
      createTest: () => {},
      updateTest: () => {},
      deleteTest: () => {},
    };
  }, [rawData, mapping]);

  return data;
};