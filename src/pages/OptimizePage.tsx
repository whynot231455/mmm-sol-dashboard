import { useState, useEffect } from "react";
import { useOptimizeData } from "../hooks/useOptimizeData";
import { BudgetSimulationSidebar } from "../components/BudgetSimulationSidebar";
import { RevenueImpactChart } from "../components/RevenueImpactChart";
import { ReallocationTable } from "../components/ReallocationTable";
import { 
  SimulationPanel, 
  type SimulationParams 
} from "../components/SimulationPanel";
import { KPICard } from "../components/KPICard";
import { formatSmartCurrency } from "../lib/formatters";
import { DollarSign, Target, TrendingUp, Save, Play } from "lucide-react";
import { useDataStore } from "../store/useDataStore";

export const OptimizePage = () => {
  const { rawData, mapping, setActivePage } = useDataStore();

  // State for Simulation
  const [tempBudget, setTempBudget] = useState<number>(0);
  const [tempWeights, setTempWeights] = useState<Record<string, number>>({});
  const [appliedParams, setAppliedParams] = useState<{
    budget: number;
    weights: Record<string, number>;
  }>({ budget: 0, weights: {} });
  const [selectedPeriod, setSelectedPeriod] = useState<number>(1);
  const [simulationParams, setSimulationParams] = useState<SimulationParams>({
    spendChange: 0,
    seasonality: 1,
    excludeOutliers: false,
  });

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
      setTempBudget(total);
      // Default Weights at 0 (No change)
      const initialWeights: Record<string, number> = {};
      Object.keys(perf).forEach((k) => (initialWeights[k] = 0));
      setTempWeights(initialWeights);

      setAppliedParams({ budget: total, weights: initialWeights });
    }
  }, [rawData, mapping.spend, mapping.channel]);

  const handleApply = () => {
    setAppliedParams({ budget: tempBudget, weights: tempWeights });
  };

  const optimization = useOptimizeData({
    totalBudget: appliedParams.budget,
    channelWeights: appliedParams.weights,
    period: selectedPeriod,
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

  const handleRunOptimization = () => {
    if (!channels || channels.length < 2) return;
    
    // Sort channels by current ROAS to find best and worst performers
    const sorted = [...channels].sort((a, b) => b.roas - a.roas);
    const topChannel = sorted[0];
    const bottomChannel = sorted[sorted.length - 1];
    
    // Create an optimized mix: shift 20% budget from lowest to highest ROAS channel
    const newWeights = { ...tempWeights };
    newWeights[topChannel.channel] = (newWeights[topChannel.channel] || 0) + 0.2;
    newWeights[bottomChannel.channel] = (newWeights[bottomChannel.channel] || 0) - 0.15;
    
    setTempWeights(newWeights);
    setAppliedParams({ budget: tempBudget, weights: newWeights });
  };

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
          <button 
            onClick={handleRunOptimization}
            className="flex items-center gap-2 px-6 py-3 bg-brand-secondary text-white rounded-xl text-sm font-bold shadow-lg shadow-red-200 hover:bg-red-600 transition-all active:scale-95"
          >
            <Play size={18} fill="currentColor" />
            Run Optimization
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Simulation Sidebar */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-8">
          <BudgetSimulationSidebar
            totalBudget={tempBudget}
            channelWeights={tempWeights}
            channels={channelNames}
            period={selectedPeriod}
            onBudgetChange={setTempBudget}
            onWeightChange={(ch, val) =>
              setTempWeights((prev) => ({ ...prev, [ch]: val }))
            }
            onPeriodChange={setSelectedPeriod}
            onApply={handleApply}
            onReset={() => {
              // Trigger useEffect again or manual reset logic
              window.location.reload(); // Simple brute tool for reset in demo
            }}
          />
          <SimulationPanel
            params={simulationParams}
            onChange={setSimulationParams}
            onRecalculate={handleApply}
          />
        </div>

        {/* Main Dashboard Area */}
        <div className="lg:col-span-8 space-y-8">
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
              label={`Forecast CPA (${selectedPeriod}Mo)`}
              value={`$${metrics.forecastCPA.toFixed(2)}`}
              trend={`${metrics.cpaTrend}%`}
              trendDirection="up"
              icon={<Target size={24} />}
            />
          </div>

          {/* New Period Impact Card */}
          {selectedPeriod > 1 && (
            <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl p-6 shadow-lg shadow-red-100 flex items-center justify-between text-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <TrendingUp size={24} className="text-white" />
                </div>
                <div>
                  <p className="text-red-100 text-xs font-bold uppercase tracking-wider">Total {selectedPeriod}-Month Incremental Impact</p>
                  <h3 className="text-2xl font-bold">{formatSmartCurrency(metrics.periodImpact)}</h3>
                </div>
              </div>
              <div className="text-right">
                <p className="text-red-100 text-xs font-medium">Estimated additional revenue for the next {selectedPeriod} months.</p>
              </div>
            </div>
          )}

          {/* Impact Chart */}
          <RevenueImpactChart data={impactTrend} />

          {/* Suggestions Table */}
          <ReallocationTable data={channels} />
        </div>
      </div>
    </div>
  );
};
