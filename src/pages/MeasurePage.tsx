import { useMeasureData } from '../hooks/useMeasureData';
import { KPICard } from '../components/KPICard';
import { TrendChart } from '../components/TrendChart';
import { IncrementalityChart } from '../components/IncrementalityChart';
import { ChannelContribution } from '../components/ChannelContribution';
import { 
  DollarSign, 
  ShoppingCart, 
  Percent, 
  TrendingUp, 
  Download, 
  Calendar,
  Globe,
  Filter,
  Database
} from 'lucide-react';
import { useDataStore } from '../store/useDataStore';
import { formatSmartCurrency, formatPercent } from '../lib/formatters';

export const MeasurePage = () => {
  const { filters: persistedFilters, setFilter, setActivePage } = useDataStore();

  const data = useMeasureData({
      country: persistedFilters.country,
      channel: persistedFilters.channel,
      dateRange: persistedFilters.dateRange
  });

  if (!data) {
    return (
      <div className="text-center py-24">
        <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <Database className="text-slate-300 w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">No Data Available</h2>
        <p className="text-slate-500 mb-6">Please import a dataset to see performance metrics.</p>
        <button 
          onClick={() => setActivePage('import')}
          className="bg-brand-secondary text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-red-700 transition-colors"
        >
          Go to Import
        </button>
      </div>
    );
  }

  const { kpi, trend, channels, filters } = data;

  // Placeholder data for incrementality until we have advanced logic
  const incrementalityData = [
    { name: 'Paid Search', value: 60 },
    { name: 'Social', value: 25 },
    { name: 'TV / Other', value: 15 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Measure Performance</h1>
          <p className="text-slate-500 mt-1">Track your marketing mix effectiveness and ROI.</p>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-xs text-slate-400 font-medium">Last updated: Today, 9:41 AM</p>
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
            <Download size={16} />
            Export Report
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2">
        <div className="relative group">
            <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <select 
                value={persistedFilters.country}
                onChange={(e) => setFilter('country', e.target.value)}
                className="pl-10 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:border-slate-300 transition-colors appearance-none cursor-pointer outline-none focus:ring-2 focus:ring-brand-primary/10"
            >
                {filters.countries.map(country => (
                    <option key={country} value={country}>{country === 'All' ? 'Country: All' : country}</option>
                ))}
            </select>
        </div>

        <div className="relative group">
            <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <select 
                value={persistedFilters.channel}
                onChange={(e) => setFilter('channel', e.target.value)}
                className="pl-10 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:border-slate-300 transition-colors appearance-none cursor-pointer outline-none focus:ring-2 focus:ring-brand-primary/10"
            >
                {filters.channels.map(channel => (
                    <option key={channel} value={channel}>{channel === 'All' ? 'Channel: All' : channel}</option>
                ))}
            </select>
        </div>

        <div className="relative group">
            <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <select 
                value={persistedFilters.dateRange}
                onChange={(e) => setFilter('dateRange', e.target.value)}
                className="pl-10 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:border-slate-300 transition-colors appearance-none cursor-pointer outline-none focus:ring-2 focus:ring-brand-primary/10"
            >
                <option>All Time</option>
                <option>Last 30 Days</option>
                <option>Last 90 Days</option>
            </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          label="Total Revenue" 
          value={formatSmartCurrency(kpi.revenue)} 
          trend="+5.2%" 
          trendDirection="up"
          icon={<DollarSign size={24} />}
        />
        <KPICard 
          label="Total Spend" 
          value={formatSmartCurrency(kpi.spend)} 
          trend="+1.2%" 
          trendDirection="up"
          icon={<ShoppingCart size={24} />}
        />
        <KPICard 
          label="ROI" 
          value={formatPercent(kpi.roi, 0)} 
          trend="+8.4%" 
          trendDirection="up"
          icon={<Percent size={24} />}
        />
        <KPICard 
          label="ROAS" 
          value={`${kpi.roas.toFixed(1)}x`} 
          trend="-0.5%" 
          trendDirection="down"
          icon={<TrendingUp size={24} />}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TrendChart data={trend} />
        </div>
        <div>
          <IncrementalityChart data={incrementalityData} />
        </div>
      </div>

      {/* Breakdown Row */}
      <div className="grid grid-cols-1">
         <ChannelContribution 
           data={channels}
         />
      </div>
    </div>
  );
};
