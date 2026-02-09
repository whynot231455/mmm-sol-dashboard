import { useState } from 'react';
import { usePredictData } from '../hooks/usePredictData';
import { ForecastChart } from '../components/ForecastChart';
import { SimulationPanel, type SimulationParams } from '../components/SimulationPanel';
import { ChannelHeatmap } from '../components/ChannelHeatmap';
import { KPICard } from '../components/KPICard';
import { TrendingUp, ShieldCheck, Calendar, Download } from 'lucide-react';
import { useDataStore } from '../store/useDataStore';

export const PredictPage = () => {
  const { setActivePage } = useDataStore();
  const [params, setParams] = useState<SimulationParams>({
    spendChange: 0,
    seasonality: 1,
    excludeOutliers: false
  });

  const data = usePredictData(params);

  // Trigger recalculation (in this simple version, state change triggers hook already)
  const handleRecalculate = () => {
      // In a real app, this might trigger an API call.
      // Here, the hook is reactive, so we just log or show a toast.
      console.log('Recalculating with:', params);
  };

  if (!data) {
    return (
      <div className="text-center py-24">
        <h2 className="text-xl font-bold text-slate-900">No Data Available</h2>
        <p className="text-slate-500 mb-6">Please import a dataset to see predictions.</p>
        <button 
          onClick={() => setActivePage('import')}
          className="bg-brand-secondary text-white px-6 py-2.5 rounded-lg font-semibold"
        >
          Go to Import
        </button>
      </div>
    );
  }

  const { charts, metrics, heatmap } = data;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Predictive Forecast</h1>
          <p className="text-slate-500 mt-1">Q4 2023 Revenue Projections & Scenario Planning</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white border border-slate-200 px-4 py-2 rounded-lg text-sm font-medium text-slate-600 flex items-center gap-2 shadow-sm">
             <Calendar size={16} />
             Oct 2023 - Dec 2023
          </div>
          <button className="bg-brand-primary text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-brand-primary/90 transition-colors flex items-center gap-2">
            <Download size={16} />
            Export Report
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <KPICard 
           label="Future Revenue (Q4)"
           value={`$${(metrics.revenue).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
           trend={`+${(metrics.lift * 100).toFixed(0)}%`}
           trendDirection="up"
           icon={<span className="font-bold text-lg">$</span>} 
        />
        <KPICard 
           label="Predicted ROAS"
           value={`${metrics.roas.toFixed(1)}x`}
           trend={`+${metrics.efficiency}x`}
           trendDirection="up"
           icon={<TrendingUp size={24} />} 
        />
        <KPICard 
           label="Confidence Interval"
           value={(metrics.confidence * 100).toFixed(0) + '%'}
           trend="Stable"
           trendDirection="up"
           icon={<ShieldCheck size={24} />} 
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Section */}
        <div className="lg:col-span-2">
            <ForecastChart data={charts.combined} />
        </div>

        {/* Sidebar Controls */}
        <div>
            <SimulationPanel 
                params={params}
                onChange={setParams}
                onRecalculate={handleRecalculate}
            />
        </div>
      </div>

      {/* Heatmap Section */}
      <div>
          <ChannelHeatmap data={heatmap} />
      </div>

    </div>
  );
};

// Simple Icons
