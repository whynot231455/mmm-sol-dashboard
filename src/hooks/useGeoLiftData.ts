import { useMemo } from "react";
import { useDataStore } from "../store/useDataStore";

export interface GeoRegion {
  id: string;
  name: string;
  population: number;
  avgRevenue: number;
  group: "treatment" | "control" | "unassigned";
  similarity: number; // 0-100 match score to treatment
}

export interface PowerAnalysisPoint {
  weeks: number;
  power80: number;
  power90: number;
  power95: number;
}

export interface TestConfig {
  testName: string;
  channel: string;
  kpi: string;
  budget: number;
  durationWeeks: number;
  startDate: string;
  endDate: string;
  status: "draft" | "scheduled" | "active" | "completed";
}

export interface MonitorDataPoint {
  date: string;
  treatment: number;
  control: number;
  counterfactual: number;
}

export interface RegionPerformance {
  region: string;
  group: "treatment" | "control";
  revenue: number;
  lift: number;
  spend: number;
}

export interface LiftResult {
  estimatedLift: number;
  liftPercent: number;
  pValue: number;
  confidenceInterval: [number, number];
  incrementalRevenue: number;
  incrementalROAS: number;
  testSpend: number;
}

export interface ChannelComparison {
  channel: string;
  geoLiftROAS: number;
  mmmROAS: number;
  delta: number;
}

export interface CounterfactualPoint {
  date: string;
  actual: number;
  counterfactual: number;
  liftArea: number;
}

export interface GeoLiftData {
  regions: GeoRegion[];
  powerAnalysis: PowerAnalysisPoint[];
  testConfig: TestConfig;
  monitorData: MonitorDataPoint[];
  regionPerformance: RegionPerformance[];
  liftResult: LiftResult;
  channelComparison: ChannelComparison[];
  counterfactualData: CounterfactualPoint[];
  pastTests: PastTest[];
}

export interface PastTest {
  id: string;
  name: string;
  channel: string;
  status: "completed" | "active" | "scheduled";
  startDate: string;
  endDate: string;
  lift: number;
  pValue: number;
}

// Deterministic hash to generate stable pseudo-random numbers from a string
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

export function useGeoLiftData(): GeoLiftData {
  const { rawData, mapping } = useDataStore();

  return useMemo(() => {
    // --- Build regions from CSV data if available ---
    let regions: GeoRegion[];

    const hasCountryData =
      rawData.length > 0 && mapping.country && mapping.revenue;

    if (hasCountryData) {
      // Extract unique countries and compute per-country metrics
      const countryStats: Record<
        string,
        { totalRevenue: number; totalSpend: number; rowCount: number }
      > = {};

      rawData.forEach((row) => {
        const country = row[mapping.country!] as string | undefined;
        if (!country) return;

        const revenue =
          parseFloat(
            String(row[mapping.revenue!] || 0).replace(/[^0-9.-]+/g, ""),
          ) || 0;
        const spend = mapping.spend
          ? parseFloat(
              String(row[mapping.spend!] || 0).replace(/[^0-9.-]+/g, ""),
            ) || 0
          : 0;

        if (!countryStats[country]) {
          countryStats[country] = { totalRevenue: 0, totalSpend: 0, rowCount: 0 };
        }
        countryStats[country].totalRevenue += revenue;
        countryStats[country].totalSpend += spend;
        countryStats[country].rowCount += 1;
      });

      const countryNames = Object.keys(countryStats).sort();

      // Find max revenue for similarity scaling
      const maxRevenue = Math.max(
        ...countryNames.map((c) => countryStats[c].totalRevenue),
      );

      // Build regions from actual CSV countries
      regions = countryNames.map((name) => {
        const stats = countryStats[name];
        const avgRevenue = Math.round(stats.totalRevenue / stats.rowCount);
        const hash = hashCode(name);

        // Similarity based on revenue relative to the highest-revenue region
        // Higher revenue regions get higher similarity scores
        const revenueRatio =
          maxRevenue > 0 ? stats.totalRevenue / maxRevenue : 0;
        const similarity = Math.round(55 + revenueRatio * 40 + (hash % 5));

        // Estimate population based on revenue (rough heuristic)
        const population = Math.round(
          (stats.totalRevenue / (avgRevenue > 0 ? avgRevenue : 1)) * 500000 +
            hash % 1000000,
        );

        return {
          id: name.toLowerCase().replace(/[^a-z0-9]/g, "-"),
          name,
          population: Math.max(population, 100000),
          avgRevenue,
          group: "unassigned" as const,
          similarity: Math.min(similarity, 98),
        };
      });

      // Sort by similarity descending
      regions.sort((a, b) => b.similarity - a.similarity);
    } else {
      // Fallback: mock data when no CSV is loaded
      regions = [
        {
          id: "region-1",
          name: "Region 1",
          population: 8340000,
          avgRevenue: 452000,
          group: "treatment",
          similarity: 100,
        },
        {
          id: "region-2",
          name: "Region 2",
          population: 3980000,
          avgRevenue: 389000,
          group: "treatment",
          similarity: 92,
        },
        {
          id: "region-3",
          name: "Region 3",
          population: 2710000,
          avgRevenue: 298000,
          group: "treatment",
          similarity: 88,
        },
        {
          id: "region-4",
          name: "Region 4",
          population: 2320000,
          avgRevenue: 267000,
          group: "control",
          similarity: 85,
        },
        {
          id: "region-5",
          name: "Region 5",
          population: 1680000,
          avgRevenue: 198000,
          group: "control",
          similarity: 82,
        },
        {
          id: "region-6",
          name: "Region 6",
          population: 1580000,
          avgRevenue: 215000,
          group: "control",
          similarity: 79,
        },
        {
          id: "region-7",
          name: "Region 7",
          population: 1530000,
          avgRevenue: 176000,
          group: "unassigned",
          similarity: 74,
        },
        {
          id: "region-8",
          name: "Region 8",
          population: 1420000,
          avgRevenue: 201000,
          group: "unassigned",
          similarity: 71,
        },
        {
          id: "region-9",
          name: "Region 9",
          population: 1340000,
          avgRevenue: 234000,
          group: "unassigned",
          similarity: 68,
        },
        {
          id: "region-10",
          name: "Region 10",
          population: 1030000,
          avgRevenue: 312000,
          group: "unassigned",
          similarity: 65,
        },
      ];
    }

    const powerAnalysis: PowerAnalysisPoint[] = [
      { weeks: 1, power80: 12, power90: 8, power95: 5 },
      { weeks: 2, power80: 28, power90: 20, power95: 14 },
      { weeks: 3, power80: 45, power90: 35, power95: 26 },
      { weeks: 4, power80: 62, power90: 52, power95: 42 },
      { weeks: 5, power80: 74, power90: 65, power95: 55 },
      { weeks: 6, power80: 83, power90: 76, power95: 67 },
      { weeks: 7, power80: 89, power90: 83, power95: 76 },
      { weeks: 8, power80: 93, power90: 88, power95: 83 },
      { weeks: 9, power80: 95, power90: 92, power95: 87 },
      { weeks: 10, power80: 97, power90: 94, power95: 91 },
      { weeks: 11, power80: 98, power90: 96, power95: 93 },
      { weeks: 12, power80: 99, power90: 97, power95: 95 },
    ];

    const testConfig: TestConfig = {
      testName: "Q1 2026 Facebook Geo Test",
      channel: "Facebook Ads",
      kpi: "Revenue",
      budget: 150000,
      durationWeeks: 8,
      startDate: "2026-01-05",
      endDate: "2026-03-01",
      status: "completed",
    };

    // Generate monitor data for 8 weeks
    const monitorData: MonitorDataPoint[] = [];
    const baseDate = new Date("2026-01-05");
    for (let i = 0; i < 56; i++) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() + i);
      const weekNum = Math.floor(i / 7);
      const base = 42000 + Math.sin(i / 7) * 3000;
      const liftFactor =
        1 + weekNum * 0.015;
      const controlNoise = (i % 7) * 200 - 600;
      const treatmentNoise = (i % 7) * 300 - 900;

      monitorData.push({
        date: date.toISOString().split("T")[0],
        treatment: Math.round(base * liftFactor + treatmentNoise),
        control: Math.round(base + controlNoise),
        counterfactual: Math.round(base + controlNoise * 0.5),
      });
    }

    // Build regionPerformance from actual regions (first 6 or all if fewer)
    const performanceRegions = regions.slice(0, 6);
    const regionPerformance: RegionPerformance[] = performanceRegions.map(
      (r, i) => {
        const isTreatment = i < Math.ceil(performanceRegions.length / 2);
        return {
          region: r.name,
          group: isTreatment ? "treatment" : "control",
          revenue: r.avgRevenue * (isTreatment ? 52 : 48),
          lift: isTreatment ? Math.round(7 + (r.similarity % 5) * 0.8) : 0,
          spend: isTreatment ? Math.round(r.avgRevenue * 0.15) : 0,
        };
      },
    );

    const liftResult: LiftResult = {
      estimatedLift: 112400,
      liftPercent: 9.4,
      pValue: 0.003,
      confidenceInterval: [6.1, 12.7],
      incrementalRevenue: 112400,
      incrementalROAS: 4.2,
      testSpend: 150000,
    };

    const channelComparison: ChannelComparison[] = [
      {
        channel: "Facebook Ads",
        geoLiftROAS: 4.2,
        mmmROAS: 3.8,
        delta: 10.5,
      },
      {
        channel: "Google Search",
        geoLiftROAS: 5.1,
        mmmROAS: 5.4,
        delta: -5.6,
      },
      {
        channel: "Instagram",
        geoLiftROAS: 3.5,
        mmmROAS: 3.1,
        delta: 12.9,
      },
      {
        channel: "YouTube",
        geoLiftROAS: 2.8,
        mmmROAS: 3.2,
        delta: -12.5,
      },
      { channel: "TikTok", geoLiftROAS: 3.9, mmmROAS: 3.6, delta: 8.3 },
    ];

    // Generate counterfactual data
    const counterfactualData: CounterfactualPoint[] = [];
    // Pre-test period (4 weeks)
    for (let i = -28; i < 0; i++) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() + i);
      const base =
        42000 + Math.sin((i + 28) / 7) * 2000;
      counterfactualData.push({
        date: date.toISOString().split("T")[0],
        actual: Math.round(base),
        counterfactual: Math.round(base),
        liftArea: 0,
      });
    }
    // Test period (8 weeks)
    for (let i = 0; i < 56; i++) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() + i);
      const weekNum = Math.floor(i / 7);
      const base = 42000 + Math.sin(i / 7) * 2000;
      const lift = base * (0.05 + weekNum * 0.008);
      counterfactualData.push({
        date: date.toISOString().split("T")[0],
        actual: Math.round(base + lift),
        counterfactual: Math.round(base),
        liftArea: Math.round(lift),
      });
    }

    const pastTests: PastTest[] = [
      {
        id: "1",
        name: "Q1 2026 Facebook Geo Test",
        channel: "Facebook Ads",
        status: "completed",
        startDate: "2026-01-05",
        endDate: "2026-03-01",
        lift: 9.4,
        pValue: 0.003,
      },
      {
        id: "2",
        name: "Q4 2025 Google Search Test",
        channel: "Google Search",
        status: "completed",
        startDate: "2025-10-01",
        endDate: "2025-11-26",
        lift: 7.2,
        pValue: 0.012,
      },
      {
        id: "3",
        name: "Q1 2026 TikTok Awareness",
        channel: "TikTok",
        status: "active",
        startDate: "2026-02-15",
        endDate: "2026-04-12",
        lift: 0,
        pValue: 0,
      },
      {
        id: "4",
        name: "Q2 2026 YouTube Brand Lift",
        channel: "YouTube",
        status: "scheduled",
        startDate: "2026-04-01",
        endDate: "2026-05-27",
        lift: 0,
        pValue: 0,
      },
    ];

    return {
      regions,
      powerAnalysis,
      testConfig,
      monitorData,
      regionPerformance,
      liftResult,
      channelComparison,
      counterfactualData,
      pastTests,
    };
  }, [rawData, mapping]);
}