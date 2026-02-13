import { useValidateData } from '../hooks/useValidateData';
import { ActualVsPredictedChart } from '../components/ActualVsPredictedChart';
import { ResidualPlot } from '../components/ResidualPlot';
import { VariableStatisticsTable } from '../components/VariableStatisticsTable';
import { KPICard } from '../components/KPICard';
import { TrendingUp, TrendingDown, Download, Play } from 'lucide-react';

export const ValidatePage = () => {
  const data = useValidateData();

  if (!data) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-900 mb-2">No Model Data Available</h2>
          <p className="text-slate-500">Please train a model first to view validation statistics.</p>
        </div>
      </div>
    );
  }

  const { metrics, chartData, residuals, variableStats, modelInfo } = data;

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Model Validation & Stats</h1>
              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold uppercase tracking-wider rounded-full">
                {modelInfo.status}
              </span>
            </div>
            <p className="text-slate-500 mt-2">
              MMM {modelInfo.version} - finalized • Last updated: {modelInfo.lastUpdated}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
              <Download size={18} />
              Export Report
            </button>
            <button className="flex items-center gap-2 px-6 py-3 bg-brand-secondary hover:bg-brand-secondary/90 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-red-100">
              <Play size={18} fill="currentColor" />
              Re-run Model
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            label="R-SQUARED"
            value={metrics.rSquared.toFixed(3)}
            trend={metrics.rSquared > 0.85 ? '+2.1%' : '-0.5%'}
            trendDirection={metrics.rSquared > 0.85 ? 'up' : 'down'}
            icon={<TrendingUp size={20} />}
          />
          <KPICard
            label="ADJUSTED R-SQUARED"
            value={metrics.adjustedRSquared.toFixed(3)}
            trend={metrics.adjustedRSquared > 0.80 ? '-0.9%' : '+1.2%'}
            trendDirection={metrics.adjustedRSquared > 0.80 ? 'down' : 'up'}
            icon={<TrendingDown size={20} />}
          />
          <KPICard
            label="MAPE"
            value={`${metrics.mape.toFixed(1)}%`}
            trend={metrics.mape < 15 ? '+1.2%' : '-2.1%'}
            trendDirection={metrics.mape < 15 ? 'up' : 'down'}
            icon={<TrendingUp size={20} />}
          />
          <KPICard
            label="DURBIN-WATSON"
            value={metrics.durbinWatson.toFixed(2)}
            icon={<TrendingUp size={20} />}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ActualVsPredictedChart data={chartData} />
          <ResidualPlot data={residuals} />
        </div>

        {/* Variable Statistics Table */}
        <VariableStatisticsTable variables={variableStats} />
    </div>
  );
};
