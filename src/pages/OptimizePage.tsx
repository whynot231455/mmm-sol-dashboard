import { useState, useEffect } from "react";
import { useOptimizeData } from "../hooks/useOptimizeData";
import { BudgetSimulationSidebar } from "../components/BudgetSimulationSidebar";
import { RevenueImpactChart } from "../components/RevenueImpactChart";
import { ReallocationTable } from "../components/ReallocationTable";
import { KPICard } from "../components/KPICard";
import { formatSmartCurrency } from "../lib/formatters";
import { DollarSign, Target, TrendingUp, Save, Play } from "lucide-react";
import { useDataStore } from "../store/useDataStore";

export const OptimizePage = () => {
  const { rawData, mapping, setActivePage } = useDataStore();

  // State for Simulation
  const [totalBudget, setTotalBudget] = useState<number>(0);
  const [channelWeights, setChannelWeights] = useState<Record<string, number>>(
    {},
  );

  // Initialize Budget and Weights from Data
  useEffect(() => {
    if (rawData.length && mapping.spend && mapping.channel) {
      const perf: Record<string, number> = {};
      let total = 0;
      rawData.forEach((row) => {
        const ch = (row[mapping.channel!] as string) || "Unknown";
        const spend =
          parseFloat(
            String(row[mapping.spend!] || 0).replace(/[^0-9.-]+/g, ""),
          ) || 0;
        perf[ch] = (perf[ch] || 0) + spend;
        total += spend;
      });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTotalBudget(total);
      // Default Weights at 0 (No change)
      const initialWeights: Record<string, number> = {};
      Object.keys(perf).forEach((k) => (initialWeights[k] = 0));
      setChannelWeights(initialWeights);
    }
  }, [rawData, mapping.spend, mapping.channel]);

  const optimization = useOptimizeData({
    totalBudget,
    channelWeights,
  });

  if (!optimization) {
    return (
      <div className="text-center py-24">
        <h2 className="text-xl font-bold text-slate-900">No Data Available</h2>
        <p className="text-slate-500 mb-6">
          Please import a dataset to run budget optimization.
        </p>
        <button
          onClick={() => setActivePage("import")}
          className="bg-brand-secondary text-white px-6 py-2.5 rounded-lg font-semibold"
        >
          Go to Import
        </button>
      </div>
    );
  }

  const { metrics, channels, impactTrend } = optimization;
  const channelNames = channels.map((c) => c.channel);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Budget Optimizer
          </h1>
          <p className="text-slate-500 mt-1">
            Simulate budget allocation scenarios across your marketing mix to
            forecast ROI impact.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
            <Save size={18} />
            Save Scenario
          </button>
          <button className="flex items-center gap-2 px-6 py-3 bg-brand-secondary text-white rounded-xl text-sm font-bold shadow-lg shadow-red-200 hover:bg-red-600 transition-all">
            <Play size={18} fill="currentColor" />
            Run Optimization
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Simulation Sidebar */}
        <div className="lg:col-span-1 h-full">
          <BudgetSimulationSidebar
            totalBudget={totalBudget}
            channelWeights={channelWeights}
            channels={channelNames}
            onBudgetChange={setTotalBudget}
            onWeightChange={(ch, val) =>
              setChannelWeights((prev) => ({ ...prev, [ch]: val }))
            }
            onReset={() => {
              // Trigger useEffect again or manual reset logic
              window.location.reload(); // Simple brute tool for reset in demo
            }}
          />
        </div>

        {/* Main Dashboard Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <KPICard
              label="Projected Revenue"
              value={formatSmartCurrency(metrics.projectedRevenue)}
              trend={`${metrics.projectedRevenueLift >= 0 ? "+" : ""}${metrics.projectedRevenueLift.toFixed(0)}%`}
              trendDirection={metrics.projectedRevenueLift >= 0 ? "up" : "down"}
              icon={<DollarSign size={24} />}
            />
            <KPICard
              label="Est. ROAS"
              value={`${metrics.estROAS.toFixed(1)}x`}
              trend={`${metrics.roasDelta >= 0 ? "+" : ""}${metrics.roasDelta.toFixed(1)}`}
              trendDirection={metrics.roasDelta >= 0 ? "up" : "down"}
              icon={<TrendingUp size={24} />}
            />
            <KPICard
              label="Forecast CPA"
              value={`$${metrics.forecastCPA.toFixed(2)}`}
              trend={`${metrics.cpaTrend}%`}
              trendDirection="up"
              icon={<Target size={24} />}
            />
          </div>

          {/* Impact Chart */}
          <RevenueImpactChart data={impactTrend} />

          {/* Suggestions Table */}
          <ReallocationTable data={channels} />
        </div>
      </div>
    </div>
  );
};
