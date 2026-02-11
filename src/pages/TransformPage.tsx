import React, { useState, useMemo } from 'react';
import { 
    Search, 
    Maximize2, 
    Download, 
    ChevronRight, 
    Play, 
    Database, 
    Layers, 
    History, 
    BarChart, 
    LogOut,
    CheckCircle2,
    Calendar,
    DollarSign,
    RefreshCcw,
    Info,
    ChevronDown,
    TrendingUp,
    Zap,
    Scale
} from 'lucide-react';
import { 
    ResponsiveContainer, 
    ComposedChart, 
    Line, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    Legend,
    Area
} from 'recharts';
import { useDataStore, type PageType } from '../store/useDataStore';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type TransformationStep = 'data-source' | 'aggregation' | 'adstock' | 'saturation' | 'final-input';

export const TransformPage = () => {
    const { 
        rawData, 
        mapping, 
        transformSettings, 
        setTransformSettings 
    } = useDataStore();
    
    const [currentStep, setCurrentStep] = useState<TransformationStep>('data-source');
    const [searchQuery, setSearchQuery] = useState('');

    const steps = useMemo(() => [
        { id: 'data-source', label: 'DATA SOURCE', icon: <Database size={20} /> },
        { id: 'aggregation', label: 'AGGREGATION', icon: <Layers size={20} /> },
        { id: 'adstock', label: 'ADSTOCK', icon: <History size={20} /> },
        { id: 'saturation', label: 'SATURATION', icon: <BarChart size={20} /> },
        { id: 'final-input', label: 'FINAL INPUT', icon: <LogOut size={20} /> },
    ], []);

    // Prepare data for the chart - using first 100 points for performance
    const chartData = useMemo(() => {
        if (!rawData || rawData.length === 0) return [];
        
        const metric = mapping?.[transformSettings?.primaryMetric] || transformSettings?.primaryMetric || 'spend';
        const dateKey = mapping?.date || 'Date';
        
        return rawData.slice(0, 100).map((row, idx) => ({
            name: row[dateKey] || `Point ${idx}`,
            value: Number(row[metric]) || 0,
        }));
    }, [rawData, mapping, transformSettings?.primaryMetric]);

    // Data for aggregation preview
    const aggregationData = useMemo(() => {
        if (!rawData || rawData.length === 0) return [];
        
        const metric = mapping?.[transformSettings?.primaryMetric] || transformSettings?.primaryMetric || 'spend';
        const dateKey = mapping?.date || 'Date';
        
        // Simple mock of aggregation for visualization
        return rawData.slice(0, 50).map((row, idx) => {
            const raw = Number(row[metric]) || 0;
            return {
                name: row[dateKey] || `Point ${idx}`,
                raw: raw,
                aggregated: idx % 7 === 0 ? raw * 1.5 : null, // Mock weekly sum
            };
        });
    }, [rawData, mapping, transformSettings?.primaryMetric]);

    // Data for Adstock preview
    const adstockData = useMemo(() => {
        if (!rawData || rawData.length === 0) return [];
        
        const metric = mapping?.[transformSettings?.primaryMetric] || transformSettings?.primaryMetric || 'spend';
        const dateKey = mapping?.date || 'Date';
        const decay = transformSettings?.adstock?.decayRate ?? 0.65;
        
        let adstockedValue = 0;
        return rawData.slice(0, 50).map((row, idx) => {
            const raw = Number(row[metric]) || 0;
            adstockedValue = raw + (adstockedValue * decay);
            return {
                name: row[dateKey] || `Point ${idx}`,
                raw: raw,
                adstock: adstockedValue / 2, // Scaled for visualization
            };
        });
    }, [rawData, mapping, transformSettings?.primaryMetric, transformSettings?.adstock?.decayRate]);

    // Data for Saturation preview
    const saturationData = useMemo(() => {
        if (!rawData || rawData.length === 0) return [];
        
        const metric = mapping?.[transformSettings?.primaryMetric] || transformSettings?.primaryMetric || 'spend';
        const slope = transformSettings?.saturation?.slope ?? 1.42;
        const inflection = transformSettings?.saturation?.inflection ?? 0.5;
        
        // Hill function: y = x^s / (x^s + k^s)
        const hill = (x: number) => {
            const xs = Math.pow(x, slope);
            const ks = Math.pow(inflection, slope);
            if (xs + ks === 0) return 0;
            return xs / (xs + ks);
        };
        
        return Array.from({ length: 50 }).map((_, idx) => {
            const x = idx / 40;
            return {
                x: x,
                spend: idx < (rawData?.length || 0) ? Number(rawData[idx]?.[metric]) / 100000 : null,
                curve: hill(x),
            };
        });
    }, [rawData, mapping, transformSettings?.primaryMetric, transformSettings?.saturation?.slope, transformSettings?.saturation?.inflection]);

    // View components to prevent parent re-renders from affecting complex DOM
    const DataSourceView = useMemo(() => {
        if (currentStep !== 'data-source') return null;
        return (
        <div className="space-y-6">
            {/* Chart Card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#871F1E]"></div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            Raw {transformSettings?.primaryMetric ?? 'spend'} ($)
                        </span>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg">
                        {['1M', '6M', '1Y', 'ALL'].map(range => (
                            <button 
                                key={range}
                                className={cn(
                                    "px-3 py-1 text-[10px] font-bold rounded-md transition-all",
                                    range === '6M' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                {range}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis 
                                dataKey="name" 
                                fontSize={10} 
                                tickLine={false} 
                                axisLine={false}
                                tick={{ fill: '#94a3b8', fontWeight: 600 }}
                            />
                            <YAxis 
                                hide 
                            />
                            <Tooltip 
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                labelStyle={{ fontWeight: 700, color: '#1e293b' }}
                            />
                            <Bar 
                                dataKey="value" 
                                fill="#871F1E10" 
                                radius={[4, 4, 0, 0]}
                                barSize={12}
                            />
                            <Line 
                                type="monotone" 
                                dataKey="value" 
                                stroke="#871F1E" 
                                strokeWidth={2.5} 
                                dot={false}
                                activeDot={{ r: 4, fill: '#871F1E', strokeWidth: 2, stroke: '#fff' }}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Table Card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
                    <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest">
                        Raw Data Preview (First 50 Rows)
                    </h3>
                    <button className="text-[11px] font-bold text-[#ED1B24] hover:underline flex items-center gap-1.5">
                        <Download size={14} />
                        Export CSV
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50">
                            <tr>
                                {['DATE', 'CHANNEL', 'SPEND', 'IMPRESSIONS', 'CLICKS'].map(header => (
                                    <th key={header} className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {rawData.slice(0, 10).map((row, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 text-xs font-semibold text-slate-600">
                                        {String(row[mapping.date || 'Date'] || '2023-01-01')}
                                    </td>
                                    <td className="px-6 py-4 text-xs font-semibold text-slate-600">
                                        {String(row[mapping.channel || 'Channel'] || 'Facebook Ads')}
                                    </td>
                                    <td className="px-6 py-4 text-xs font-bold text-slate-900">
                                        ${Number(row[mapping.spend || 'Spend']).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-xs font-semibold text-slate-600">
                                        {Number(row['Impressions'] || 1240000).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-xs font-semibold text-slate-600">
                                        {Number(row['Clicks'] || 14200).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        );
    }, [currentStep, chartData, transformSettings?.primaryMetric, rawData, mapping.date, mapping.channel, mapping.spend]);

    const AggregationView = useMemo(() => {
        if (currentStep !== 'aggregation') return null;
        return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 h-full">
            <div className="flex items-center gap-4 mb-8">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-slate-200"></div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Raw Daily Data</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#ED1B24]"></div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider underline decoration-[#ED1B24] decoration-2">
                        Aggregated Result (Weekly)
                    </span>
                </div>
                <div className="ml-auto flex items-center gap-2 bg-slate-50 p-1 rounded-lg">
                    {['1M', '6M', '1Y'].map(range => (
                        <button 
                            key={range}
                            className={cn(
                                "px-3 py-1 text-[10px] font-bold rounded-md transition-all",
                                range === '6M' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            {range}
                        </button>
                    ))}
                </div>
            </div>

            <div className="h-[500px] w-full relative">
                <div className="absolute top-4 left-4 z-10 flex gap-4">
                    <div className="bg-white/80 backdrop-blur-sm border border-slate-100 rounded-xl px-4 py-2 shadow-sm">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Agg. Value</span>
                        <div className="text-sm font-extrabold text-[#871F1E]">$42.5k</div>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm border border-slate-100 rounded-xl px-4 py-2 shadow-sm">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Points</span>
                        <div className="text-sm font-extrabold text-[#871F1E]">24</div>
                    </div>
                </div>

                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={aggregationData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                        <XAxis 
                            dataKey="name" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false}
                            tick={{ fill: '#94a3b8', fontWeight: 600 }}
                        />
                        <YAxis hide />
                        <Tooltip />
                        <Bar 
                            dataKey="raw" 
                            fill="#f1f5f9" 
                            radius={[4, 4, 0, 0]}
                            barSize={30}
                        />
                        <Line 
                            type="stepAfter" 
                            dataKey="aggregated" 
                            stroke="#ED1B24" 
                            strokeWidth={3} 
                            connectNulls
                            dot={false}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
        );
    }, [currentStep, aggregationData]);

    const AdstockView = useMemo(() => {
        if (currentStep !== 'adstock') return null;
        return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 h-full relative overflow-hidden">
            <div className="flex items-center gap-4 mb-8">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-slate-100"></div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Raw {transformSettings?.primaryMetric ?? 'spend'} ($)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#ED1B24]"></div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Adstock Decay</span>
                </div>
                <div className="ml-auto flex items-center gap-2 bg-slate-50 p-1 rounded-lg">
                    {['1M', '6M', '1Y'].map(range => (
                        <button key={range} className={cn("px-3 py-1 text-[10px] font-bold rounded-md", range === '6M' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400")}>
                            {range}
                        </button>
                    ))}
                </div>
            </div>

            <div className="h-[500px] w-full relative">
                <div className="absolute top-4 left-4 z-10 flex gap-4">
                    <div className="bg-white border border-slate-100 rounded-xl px-4 py-2 shadow-xl shadow-slate-200/50 flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">R²</span>
                        <div className="text-sm font-black text-[#871F1E]">{transformSettings?.metrics?.r2 ?? 0}</div>
                    </div>
                    <div className="bg-white border border-slate-100 rounded-xl px-4 py-2 shadow-xl shadow-slate-200/50 flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">VIF</span>
                        <div className="text-sm font-black text-emerald-500">{transformSettings?.metrics?.vif ?? 0}</div>
                    </div>
                </div>

                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={adstockData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                        <XAxis dataKey="name" hide />
                        <YAxis hide />
                        <Bar 
                            dataKey="raw" 
                            fill="#f1f5f9" 
                            radius={[8, 8, 0, 0]}
                            barSize={40}
                        />
                        <Line 
                            type="monotone" 
                            dataKey="adstock" 
                            stroke="#ED1B24" 
                            strokeWidth={3} 
                            dot={false}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
        );
    }, [currentStep, adstockData, transformSettings?.metrics, transformSettings?.primaryMetric]);

    const SaturationView = useMemo(() => {
        if (currentStep !== 'saturation') return null;
        return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 h-full relative">
            <div className="flex items-center gap-4 mb-8">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#ED1B24]"></div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Response Curve</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-slate-200"></div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Observed Spend</span>
                </div>
                <div className="ml-auto flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                    {['Hill', 'S-Curve', 'Power'].map(curve => (
                        <button 
                            key={curve}
                                onClick={() => setTransformSettings({ saturation: { ...(transformSettings?.saturation || { active: true, curveType: 'hill', slope: 1.42, inflection: 0.5 }), curveType: curve.toLowerCase() as any } })}
                                className={cn(
                                    "px-4 py-1.5 text-[10px] font-bold rounded-lg transition-all",
                                    transformSettings?.saturation?.curveType === curve.toLowerCase() ? "bg-white text-slate-900 shadow-sm" : "text-slate-400"
                                )}
                        >
                            {curve}
                        </button>
                    ))}
                </div>
            </div>

            <div className="h-[500px] w-full relative">
                <div className="absolute top-10 right-10 z-10 space-y-4">
                    <div className="bg-white/90 backdrop-blur-md border border-slate-100 rounded-2xl p-4 shadow-2xl shadow-slate-200 space-y-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center block">Saturation Point</span>
                        <div className="flex items-baseline justify-center gap-1">
                            <span className="text-xl font-black text-[#871F1E]">82%</span>
                            <span className="text-[10px] font-bold text-slate-400">of max</span>
                        </div>
                    </div>
                    <div className="bg-white/90 backdrop-blur-md border border-slate-100 rounded-2xl p-4 shadow-2xl shadow-slate-200 space-y-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center block">Efficiency Score</span>
                        <div className="flex items-baseline justify-center gap-1">
                            <span className="text-xl font-black text-emerald-500">High</span>
                            <span className="text-[10px] font-bold text-slate-400">(1.4 ROI)</span>
                        </div>
                    </div>
                </div>

                <div className="absolute left-0 top-1/2 -translate-y-1/2 -rotate-90 origin-left text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] pointer-events-none">
                    Incremental Revenue
                </div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] pointer-events-none">
                    Media Spend
                </div>

                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={saturationData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <CartesianGrid strokeDasharray="2 2" stroke="#f1f5f9" />
                        <XAxis dataKey="x" hide />
                        <YAxis hide />
                        <Bar 
                            dataKey="spend" 
                            fill="#cbd5e1" 
                            opacity={0.3}
                            radius={[10, 10, 10, 10]}
                            barSize={4}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="curve" 
                            stroke="#ED1B24" 
                            strokeWidth={3} 
                            fill="url(#colorCurve)" 
                            dot={false}
                        />
                        <defs>
                            <linearGradient id="colorCurve" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ED1B24" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#ED1B24" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
        );
    }, [currentStep, saturationData, transformSettings?.saturation, transformSettings?.metrics, setTransformSettings]);

    return (
        <div className="flex flex-col h-full animate-in slide-in-from-bottom-2 duration-500">
            {/* Header Area */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                        {currentStep === 'data-source' ? 'Data Source Configuration' : 'Facebook Spend Transformation'}
                    </h1>
                    <p className="text-sm font-semibold text-slate-500 mt-0.5">
                        {currentStep === 'data-source' 
                            ? 'Configure raw inputs and metric definitions' 
                            : 'Pipeline visualization and effects preview'}
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 bg-slate-100/50 p-1 rounded-xl border border-slate-200">
                        <button className="p-2 text-slate-400 hover:text-slate-600 bg-white shadow-sm rounded-lg border border-slate-200 transition-all">
                            <Search size={18} />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-slate-600 transition-all">
                            <Maximize2 size={18} />
                        </button>
                    </div>
                    <button className="flex items-center gap-2 px-6 py-2.5 bg-[#871F1E] hover:bg-[#a12524] text-white rounded-xl text-sm font-bold shadow-lg shadow-[#871F1E]/20 transition-all active:scale-95 group">
                        Apply to Model
                        <Play size={14} className="fill-white group-hover:translate-x-0.5 transition-transform" />
                    </button>
                </div>
            </div>

            {/* Step Navigation */}
            <div className="flex items-center justify-center gap-16 mb-12 relative px-20">
                <div className="absolute top-1/2 left-40 right-40 h-[1.5px] bg-slate-100 -translate-y-10 -z-10"></div>
                {steps.map((step) => {
                    const isActive = currentStep === step.id;
                    return (
                        <div 
                            key={step.id} 
                            className="flex flex-col items-center gap-3 cursor-pointer group"
                            onClick={() => setCurrentStep(step.id as TransformationStep)}
                        >
                            <div className={cn(
                                "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 relative",
                                isActive 
                                    ? "bg-[#871F1E] text-white shadow-xl shadow-[#871F1E]/30 scale-110 border-2 border-[#871F1E]" 
                                    : "bg-white text-slate-400 border border-slate-200 group-hover:border-slate-300 group-hover:text-slate-600"
                            )}>
                                {step.icon}
                                {isActive && (
                                    <div className="absolute -inset-1 rounded-2xl border-2 border-[#871F1E] animate-ping opacity-20 pointer-events-none"></div>
                                )}
                            </div>
                            <span className={cn(
                                "text-[10px] font-black tracking-widest transition-colors",
                                isActive ? "text-[#871F1E]" : "text-slate-400 group-hover:text-slate-600"
                            )}>
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-12 gap-8 items-start">
                {/* Visualizer Column */}
                <div className="col-span-12 lg:col-span-9">
                    {currentStep === 'data-source' && DataSourceView}
                    {currentStep === 'aggregation' && AggregationView}
                    {currentStep === 'adstock' && AdstockView}
                    {currentStep === 'saturation' && SaturationView}
                    
                    {/* Placeholder for other steps */}
                    {['final-input'].includes(currentStep) && (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center space-y-4">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                                <Zap size={32} />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 tracking-tight capitalize">
                                {currentStep} Stage
                            </h2>
                            <p className="text-slate-500 max-w-sm mx-auto text-sm font-medium">
                                The {currentStep} transformation engine is being optimized. 
                                Designs for this section are coming soon.
                            </p>
                        </div>
                    )}
                </div>

                {/* Configuration Sidebar */}
                <div className="col-span-12 lg:col-span-3 space-y-6 lg:sticky lg:top-8">
                    <div className="space-y-1">
                        <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest">Configuration</h2>
                        <p className="text-[10px] font-bold text-slate-400 capitalize">Map raw data to model inputs</p>
                    </div>

                    {(() => {
                        switch (currentStep) {
                            case 'data-source':
                                return (
                                    <div className="space-y-6">
                                        {/* Primary Metric Selectors */}
                                        <div className="space-y-4">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Primary Metric</span>
                                            <div className="space-y-2">
                                                {[
                                                    { id: 'spend', label: 'Spend ($)', desc: 'Cost per time unit' },
                                                    { id: 'impressions', label: 'Impressions', desc: 'Total views delivered' },
                                                    { id: 'clicks', label: 'Clicks', desc: 'Gross Rating Points' }
                                                ].map(metric => {
                                                    const isSelected = transformSettings.primaryMetric === metric.id;
                                                    return (
                                                        <button 
                                                            key={metric.id}
                                                            onClick={() => setTransformSettings({ primaryMetric: metric.id as any })}
                                                            className={cn(
                                                                "w-full flex items-center gap-4 px-4 py-4 rounded-xl border text-left transition-all group relative",
                                                                isSelected 
                                                                    ? "bg-[#871F1E]/[0.02] border-[#871F1E] shadow-sm" 
                                                                    : "bg-white border-slate-100 hover:border-slate-300"
                                                            )}
                                                        >
                                                            <div className={cn(
                                                                "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                                                                isSelected ? "border-[#871F1E]" : "border-slate-300 group-hover:border-slate-400"
                                                            )}>
                                                                {isSelected && <div className="w-2 h-2 rounded-full bg-[#871F1E]"></div>}
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className={cn(
                                                                    "text-xs font-bold",
                                                                    isSelected ? "text-slate-900" : "text-slate-600"
                                                                )}>{metric.label}</div>
                                                                <div className="text-[10px] font-semibold text-slate-400">{metric.desc}</div>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Data Filters */}
                                        <div className="space-y-4">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data Filters</span>
                                            <div className="space-y-3">
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Date Range</label>
                                                    <div className="flex gap-2">
                                                        <div className="flex-1 relative">
                                                            <input 
                                                                type="text" 
                                                                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:border-[#871F1E] outline-none"
                                                                value={transformSettings?.dateRange?.start ?? ''}
                                                                readOnly
                                                            />
                                                            <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                        </div>
                                                        <div className="flex-1 relative">
                                                            <input 
                                                                type="text" 
                                                                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:border-[#871F1E] outline-none"
                                                                value={transformSettings?.dateRange?.end ?? ''}
                                                                readOnly
                                                            />
                                                            <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Currency</label>
                                                    <div className="relative">
                                                        <select 
                                                            className="w-full appearance-none px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:border-[#871F1E] outline-none cursor-pointer"
                                                            value={transformSettings?.currency ?? 'USD ($)'}
                                                            onChange={(e) => setTransformSettings({ currency: e.target.value })}
                                                        >
                                                            <option>USD ($)</option>
                                                            <option>EUR (€)</option>
                                                            <option>GBP (£)</option>
                                                        </select>
                                                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Data Quality */}
                                        <div className="space-y-4">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data Quality</span>
                                            <div className="bg-[#FACC00]/10 border border-[#FACC00]/20 rounded-xl p-4 flex gap-3">
                                                <div className="w-8 h-8 rounded-full bg-[#FACC00] flex items-center justify-center shrink-0">
                                                    <CheckCircle2 size={16} className="text-white" />
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold text-slate-900">No Errors Found</div>
                                                    <div className="text-[10px] font-semibold text-slate-500">0 null values in selected range.</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            case 'adstock':
                                return (
                                    <div className="space-y-8 animate-in fade-in duration-500">
                                        {/* Time Aggregation Info */}
                                        <div className="space-y-4">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Time Aggregation</span>
                                            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl opacity-60">
                                                {['daily', 'weekly', 'monthly'].map(gran => (
                                                    <button key={gran} className={cn("py-1.5 text-[10px] font-black rounded-lg capitalize", gran === 'weekly' ? "bg-white text-slate-900" : "text-slate-400")}>
                                                        {gran}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Adstock Decay */}
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Adstock Decay</span>
                                                <span className="px-2 py-0.5 bg-[#ED1B24]/5 text-[#ED1B24] text-[9px] font-black rounded uppercase">Geometric</span>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-xs font-bold text-slate-700">Decay Rate (α)</label>
                                                    <div className="text-xs font-black text-[#871F1E]">{transformSettings?.adstock?.decayRate ?? 0.65}</div>
                                                </div>
                                                <input 
                                                    type="range" 
                                                    min="0" 
                                                    max="1" 
                                                    step="0.01"
                                                    value={transformSettings?.adstock?.decayRate ?? 0.65}
                                                    onChange={(e) => setTransformSettings({ adstock: { ...(transformSettings?.adstock || { type: 'geometric', decayRate: 0.65 }), decayRate: parseFloat(e.target.value) } })}
                                                    className="w-full accent-[#871F1E] h-1.5"
                                                />
                                                <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase">
                                                    <span>Fast</span>
                                                    <span>Slow</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Saturation Hill Preview */}
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Saturation Hill</span>
                                                <div className={cn(
                                                    "w-8 h-4 rounded-full relative transition-colors cursor-pointer",
                                                    transformSettings?.saturation?.active ? "bg-[#ED1B24]" : "bg-slate-200"
                                                )} onClick={() => setTransformSettings({ saturation: { ...(transformSettings?.saturation || { active: true, curveType: 'hill', slope: 1.42, inflection: 0.5 }), active: !transformSettings?.saturation?.active } })}>
                                                    <div className={cn(
                                                        "absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all",
                                                        transformSettings?.saturation?.active ? "right-0.5" : "left-0.5"
                                                    )}></div>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-xs font-bold text-slate-700">Slope (Shape)</label>
                                                    <div className="text-xs font-black text-[#871F1E]">{transformSettings?.saturation?.slope ?? 1.42}</div>
                                                </div>
                                                <input 
                                                    type="range" min="0.1" max="5" step="0.1"
                                                    value={transformSettings?.saturation?.slope ?? 1.42}
                                                    onChange={(e) => setTransformSettings({ saturation: { ...(transformSettings?.saturation || { active: true, curveType: 'hill', slope: 1.42, inflection: 0.5 }), slope: parseFloat(e.target.value) } })}
                                                    className="w-full accent-[#871F1E] h-1.5"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            case 'saturation':
                                return (
                                    <div className="space-y-8 animate-in fade-in duration-500">
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Saturation Hill</span>
                                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-black rounded uppercase">Active</span>
                                            </div>
                                            <div className="bg-[#871F1E]/5 border-l-4 border-[#871F1E] p-4 rounded-r-xl space-y-2">
                                                <div className="flex items-center gap-2 text-[#871F1E]">
                                                    <Info size={14} />
                                                    <span className="text-[10px] font-black uppercase">Note</span>
                                                </div>
                                                <p className="text-[10px] font-bold text-slate-500 leading-relaxed italic">
                                                    Adjusting the slope changes how quickly returns diminish. Inflection determines the point of maximum efficiency.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-xs font-bold text-slate-700">Slope (Shape)</label>
                                                    <div className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-black text-[#871F1E]">{transformSettings?.saturation?.slope ?? 1.42}</div>
                                                </div>
                                                <input 
                                                    type="range" min="0.1" max="5" step="0.1"
                                                    value={transformSettings?.saturation?.slope ?? 1.42}
                                                    onChange={(e) => setTransformSettings({ saturation: { ...(transformSettings?.saturation || { active: true, curveType: 'hill', slope: 1.42, inflection: 0.5 }), slope: parseFloat(e.target.value) } })}
                                                    className="w-full accent-[#871F1E] h-1.5"
                                                />
                                            </div>
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-xs font-bold text-slate-700">Inflection Point</label>
                                                    <div className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-black text-[#871F1E]">{transformSettings?.saturation?.inflection ?? 0.5}</div>
                                                </div>
                                                <input 
                                                    type="range" min="0.1" max="1" step="0.01"
                                                    value={transformSettings?.saturation?.inflection ?? 0.5}
                                                    onChange={(e) => setTransformSettings({ saturation: { ...(transformSettings?.saturation || { active: true, curveType: 'hill', slope: 1.42, inflection: 0.5 }), inflection: parseFloat(e.target.value) } })}
                                                    className="w-full accent-[#871F1E] h-1.5"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Model Fit Metrics</span>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                                                    <div className="text-[9px] font-black text-slate-400 uppercase mb-1">R-Squared</div>
                                                    <div className="text-sm font-black text-slate-900">{transformSettings?.metrics?.r2 ?? 0}</div>
                                                </div>
                                                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                                                    <div className="text-[9px] font-black text-slate-400 uppercase mb-1">RSS</div>
                                                    <div className="text-sm font-black text-slate-900">{transformSettings?.metrics?.rss ?? '0'}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            case 'aggregation':
                            default:
                                return (
                                    <div className="space-y-8 animate-in fade-in duration-500">
                                        {/* Time Aggregation */}
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Time Aggregation</span>
                                                <span className="px-2 py-0.5 bg-[#871F1E]/5 text-[#871F1E] text-[9px] font-black rounded uppercase">Active</span>
                                            </div>
                                            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
                                                {['daily', 'weekly', 'monthly'].map(gran => (
                                                    <button 
                                                        key={gran}
                                                        onClick={() => setTransformSettings({ aggregation: { ...(transformSettings?.aggregation || { granularity: 'weekly', method: 'sum', weekStarting: 'monday' }), granularity: gran as any } })}
                                                        className={cn(
                                                            "py-1.5 text-[10px] font-black rounded-lg transition-all capitalize",
                                                            transformSettings?.aggregation?.granularity === gran 
                                                                ? "bg-white text-slate-900 shadow-sm" 
                                                                : "text-slate-400 hover:text-slate-600"
                                                        )}
                                                    >
                                                        {gran}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Aggregation Method */}
                                        <div className="space-y-4">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aggregation Method</span>
                                            <div className="space-y-2">
                                                {[
                                                    { id: 'sum', label: 'Sum' },
                                                    { id: 'avg', label: 'Average' },
                                                    { id: 'max', label: 'Max' }
                                                ].map(method => {
                                                    const isSelected = transformSettings.aggregation.method === method.id;
                                                    return (
                                                        <button 
                                                            key={method.id}
                                                            onClick={() => setTransformSettings({ aggregation: { ...(transformSettings?.aggregation || { granularity: 'weekly', method: 'sum', weekStarting: 'monday' }), method: method.id as any } })}
                                                            className={cn(
                                                                "w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all group",
                                                                isSelected 
                                                                    ? "bg-[#871F1E]/[0.02] border-[#871F1E] shadow-sm" 
                                                                    : "bg-white border-slate-100 hover:border-slate-300"
                                                            )}
                                                        >
                                                            <span className={cn(
                                                                "text-xs font-bold",
                                                                isSelected ? "text-slate-900" : "text-slate-500"
                                                            )}>{method.label}</span>
                                                            <div className={cn(
                                                                "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                                                                isSelected ? "border-[#871F1E]" : "border-slate-300 group-hover:border-slate-400"
                                                            )}>
                                                                {isSelected && <div className="w-2 h-2 rounded-full bg-[#871F1E]"></div>}
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Week Starting */}
                                        <div className="space-y-4">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Week Starting</span>
                                            <div className="grid grid-cols-2 gap-2">
                                                {['monday', 'sunday'].map(day => {
                                                    const isSelected = transformSettings?.aggregation?.weekStarting === day;
                                                    return (
                                                        <button 
                                                            key={day}
                                                        onClick={() => setTransformSettings({ aggregation: { ...(transformSettings?.aggregation || { granularity: 'weekly', method: 'sum', weekStarting: 'monday' }), weekStarting: day as any } })}
                                                            className={cn(
                                                                "py-2 px-4 rounded-xl border text-[10px] font-extrabold transition-all capitalize",
                                                                isSelected 
                                                                    ? "bg-[#871F1E]/5 border-[#871F1E] text-[#871F1E]" 
                                                                    : "bg-white border-slate-100 text-slate-500 hover:border-slate-300"
                                                            )}
                                                        >
                                                            {day}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                );
                        }
                    })()}

                    {/* Footer Actions */}
                    <div className="pt-6 border-t border-slate-100 space-y-3">
                        <button 
                            className="w-full py-3 px-4 rounded-xl border border-slate-200 text-[11px] font-black text-slate-600 hover:bg-slate-50 transition-all active:scale-[0.98]"
                        >
                            Reset to Default
                        </button>
                        <div className="flex items-center gap-2 px-2 text-[9px] font-bold text-slate-400">
                            <RefreshCcw size={10} />
                            <span>Changes update chart preview</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
