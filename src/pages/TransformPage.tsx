import { useState, useMemo } from 'react';
import { 
    Search, 
    Maximize2, 
    Download, 
    Play, 
    Database, 
    History, 
    BarChart, 
    LogOut,
    Calendar,
    RefreshCcw,
    Info,
    ChevronDown,
    Zap,
    Sliders
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
    Area
} from 'recharts';
import { useDataStore } from '../store/useDataStore';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type TransformationStep = 'data-source' | 'adstock' | 'saturation' | 'control-variable' | 'final-input';

export const TransformPage = () => {
    const { 
        rawData, 
        mapping, 
        transformSettings, 
        setTransformSettings 
    } = useDataStore();
    
    const [currentStep, setCurrentStep] = useState<TransformationStep>('data-source');

    // Centralized filtering logic
    const filteredData = useMemo(() => {
        if (!rawData || rawData.length === 0) return [];
        
        const source = transformSettings?.dataSource || 'All Sources';
        const { start, end } = transformSettings?.dateRange || {};
        const channelKey = mapping?.channel || 'Channel';
        const dateKey = mapping?.date || 'Date';
        
        return rawData.filter(row => {
            // Filter by Data Source
            const matchesSource = source === 'All Sources' || String(row[channelKey]) === source;
            
            // Filter by Date Range
            const rowDate = String(row[dateKey]);
            const matchesDate = (!start || rowDate >= start) && (!end || rowDate <= end);
            
            return matchesSource && matchesDate;
        });
    }, [rawData, transformSettings?.dataSource, transformSettings?.dateRange, mapping?.channel, mapping?.date]);

    const steps = useMemo(() => [
        { id: 'data-source', label: 'DATA SOURCE', icon: <Database size={20} /> },
        { id: 'adstock', label: 'ADSTOCK', icon: <History size={20} /> },
        { id: 'control-variable', label: 'CONTROL VAR', icon: <Sliders size={20} /> },
        { id: 'saturation', label: 'SATURATION', icon: <BarChart size={20} /> },
        { id: 'final-input', label: 'FINAL INPUT', icon: <LogOut size={20} /> },
    ], []);

    // Prepare data for the chart - using first 100 points for performance
    const chartData = useMemo(() => {
        if (!filteredData || filteredData.length === 0) return [];
        
        const metric = mapping?.[transformSettings?.primaryMetric] || transformSettings?.primaryMetric || 'spend';
        const dateKey = mapping?.date || 'Date';
        
        return filteredData.slice(0, 100).map((row, idx) => ({
            name: row[dateKey] || `Point ${idx}`,
            value: Number(row[metric]) || 0,
        }));
    }, [filteredData, mapping, transformSettings?.primaryMetric]);

    // Data for Control Variable preview
    const controlVariableData = useMemo(() => {
        if (!filteredData || filteredData.length === 0) return [];
        
        const dateKey = mapping?.date || 'Date';
        
        return filteredData.slice(0, 50).map((row, idx) => {
            // Mocking Price vs Volume with Elasticity
            // Base Price around $50, Volume around 1000 units
            // Inverse relationship: Price up -> Volume down
            const basePrice = 50 + Math.sin(idx / 5) * 10;
            const seasonalEffect = Math.cos(idx / 8) * 5;
            const discount = (idx === 15 || idx === 35) ? 15 : 0; // Black Friday / Summer Sale
            
            const finalPrice = basePrice + seasonalEffect - discount;
            const elasticity = -1.8;
            const volumeChange = ((finalPrice - 50) / 50) * elasticity;
            const volume = 1000 * (1 + volumeChange) + Math.random() * 50;

            return {
                name: row[dateKey] || `Week ${idx}`,
                price: finalPrice,
                volume: volume,
                isDiscount: discount > 0,
                annotation: idx === 15 ? 'Black Friday' : idx === 35 ? 'Summer Sale' : null
            };
        });
    }, [filteredData, mapping]);

    // Data for Adstock preview
    const adstockData = useMemo(() => {
        if (!filteredData || filteredData.length === 0) return [];
        
        const metric = mapping?.[transformSettings?.primaryMetric] || transformSettings?.primaryMetric || 'spend';
        const dateKey = mapping?.date || 'Date';
        const decay = transformSettings?.adstock?.decayRate ?? 0.65;
        
        let adstockedValue = 0;
        return filteredData.slice(0, 50).map((row, idx) => {
            const raw = Number(row[metric]) || 0;
            adstockedValue = raw + (adstockedValue * decay);
            return {
                name: row[dateKey] || `Point ${idx}`,
                raw: raw,
                adstock: adstockedValue / 2, // Scaled for visualization
            };
        });
    }, [filteredData, mapping, transformSettings?.primaryMetric, transformSettings?.adstock?.decayRate]);

    // Data for Saturation preview
    const saturationData = useMemo(() => {
        if (!filteredData || filteredData.length === 0) return [];
        
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
                spend: idx < (filteredData?.length || 0) ? Number(filteredData[idx]?.[metric]) / 100000 : null,
                curve: hill(x),
            };
        });
    }, [filteredData, mapping, transformSettings?.primaryMetric, transformSettings?.saturation?.slope, transformSettings?.saturation?.inflection]);

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
                                labelStyle={{ fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}
                                itemStyle={{ color: '#1e293b', fontWeight: 600, textTransform: 'capitalize' }}
                                formatter={(value: number | string | undefined) => {
                                    if (value === undefined) return ['', transformSettings?.primaryMetric === 'spend' ? 'Spend' : transformSettings?.primaryMetric === 'impressions' ? 'Impressions' : 'Clicks'];
                                    const label = transformSettings?.primaryMetric === 'spend' ? 'Spend' : transformSettings?.primaryMetric === 'impressions' ? 'Impressions' : 'Clicks';
                                    return [`$${Number(value).toLocaleString()}`, label];
                                }}
                            />
                            <Bar 
                                dataKey="value" 
                                fill="#871F1E10" 
                                radius={[4, 4, 0, 0]}
                                barSize={12}
                                tooltipType="none"
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
                            {filteredData.slice(0, 10).map((row, idx) => (
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
    }, [currentStep, chartData, transformSettings?.primaryMetric, filteredData, mapping.date, mapping.channel, mapping.spend]);

    const ControlVariableView = useMemo(() => {
        if (currentStep !== 'control-variable') return null;
        return (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 h-full">
                {/* Header / Legend */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full border-2 border-[#871F1E] bg-white"></div>
                            <span className="text-xs font-bold text-slate-700">Avg Product Price</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-0.5 border-t-2 border-slate-400 border-dashed"></div>
                            <span className="text-xs font-bold text-slate-400">Sales Volume</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                        {['Weekly', 'Monthly', 'Quarterly'].map(range => (
                            <button 
                                key={range}
                                className={cn(
                                    "px-4 py-1.5 text-[10px] font-black rounded-lg transition-all",
                                    range === 'Weekly' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                {range}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="h-[450px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={controlVariableData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis 
                                dataKey="name" 
                                fontSize={10} 
                                tickLine={false} 
                                axisLine={false}
                                tick={{ fill: '#94a3b8', fontWeight: 600 }}
                            />
                            <YAxis 
                                yAxisId="left"
                                label={{ value: 'PRICE ($)', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#94a3b8', fontWeight: 800, offset: 0 }}
                                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                                axisLine={false}
                                tickLine={false}
                                domain={['auto', 'auto']}
                            />
                            <YAxis 
                                yAxisId="right"
                                orientation="right"
                                hide
                            />
                            <Tooltip 
                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                labelStyle={{ fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}
                                itemStyle={{ fontWeight: 600, fontSize: '11px' }}
                                formatter={(value: number | undefined, name: string | undefined) => {
                                    if (name === 'price') return [`$${Number(value ?? 0).toFixed(2)}`, 'Avg Price' as const];
                                    if (name === 'volume') return [Math.round(Number(value ?? 0)).toLocaleString(), 'Volume' as const];
                                    return [value ?? '', name ?? ''];
                                }}
                            />
                            
                            {/* Annotations Regions (Mocked visually with ReferenceArea if needed, or stick to lines) */}
                            
                            <Line 
                                yAxisId="left"
                                type="monotone" 
                                dataKey="price" 
                                stroke="#871F1E" 
                                strokeWidth={3} 
                                dot={(props: any) => {
                                    const { cx, cy, payload } = props;
                                    if (payload.isDiscount) {
                                        return (
                                            <circle cx={cx} cy={cy} r={4} fill="#white" stroke="#871F1E" strokeWidth={2} />
                                        );
                                    }
                                    return <></>;
                                }}
                            />
                            <Line 
                                yAxisId="right"
                                type="monotone" 
                                dataKey="volume" 
                                stroke="#94a3b8" 
                                strokeWidth={2} 
                                strokeDasharray="5 5"
                                dot={false} 
                            />
                        </ComposedChart>
                    </ResponsiveContainer>

                    {/* Annotation Markers */}
                    <div className="absolute top-[30%] left-[30%] h-[40%] w-[8%] border-x border-[#F59E0B]/30 bg-[#F59E0B]/5 flex flex-col justify-center items-center gap-1 pointer-events-none">
                        <div className="text-[9px] font-black text-[#F59E0B] -rotate-90 whitespace-nowrap">BLACK FRI</div>
                    </div>
                    <div className="absolute top-[30%] left-[70%] h-[40%] w-[8%] border-x border-[#F59E0B]/30 bg-[#F59E0B]/5 flex flex-col justify-center items-center gap-1 pointer-events-none">
                        <div className="text-[9px] font-black text-[#F59E0B] -rotate-90 whitespace-nowrap">SUMMER</div>
                    </div>

                    {/* Point Annotation */}
                    <div className="absolute top-[65%] left-[32%] flex flex-col items-center animate-in fade-in slide-in-from-bottom-2 duration-700">
                        <div className="w-2 h-2 rounded-full border-2 border-[#871F1E] bg-white mb-1"></div>
                        <span className="text-[9px] font-black text-[#871F1E]">Discount Applied</span>
                    </div>

                    {/* Stats Cards Overlays */}
                    <div className="absolute top-4 right-4 bg-white border border-slate-100 shadow-xl shadow-slate-200/50 rounded-2xl p-4 w-40 space-y-3">
                        <div>
                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Price Elasticity</div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-black text-[#871F1E]">-1.8</span>
                                <span className="text-[9px] font-bold text-slate-400">high sens.</span>
                            </div>
                        </div>
                        <div className="h-px bg-slate-50 w-full"></div>
                        <div>
                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Avg Discount</div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-xl font-black text-[#F59E0B]">15%</span>
                                <span className="text-[9px] font-bold text-slate-400">active</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="mt-4 text-center text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">
                    Time (Weeks)
                </div>
            </div>
        );
    }, [currentStep, controlVariableData]);

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
                        <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            labelStyle={{ fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}
                            itemStyle={{ color: '#1e293b', fontWeight: 600 }}
                            formatter={(value: number | string | undefined, name: string | undefined) => {
                                const displayName = (name === 'raw' ? 'Raw Spend' : 'Adstock Decay') as 'Raw Spend' | 'Adstock Decay';
                                if (value === undefined) return ['', displayName];
                                return [`$${Number(value).toLocaleString()}`, displayName];
                            }}
                        />
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
                                onClick={() => setTransformSettings({ saturation: { ...(transformSettings?.saturation || { active: true, curveType: 'hill', slope: 1.42, inflection: 0.5 }), curveType: curve.toLowerCase() as 'hill' | 's-curve' | 'power' } })}
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
                        <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            labelStyle={{ fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}
                            itemStyle={{ color: '#1e293b', fontWeight: 600 }}
                            formatter={(value: number | string | undefined, name: string | undefined) => {
                                const displayName = (name === 'curve' ? 'Response Curve' : 'Observed Spend') as 'Response Curve' | 'Observed Spend';
                                if (value === undefined) return ['', displayName];
                                return [
                                    name === 'curve' ? `${(Number(value) * 100).toFixed(1)}%` : `$${Number(value).toLocaleString()}`,
                                    displayName
                                ];
                            }}
                        />
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
    }, [currentStep, saturationData, transformSettings?.saturation, setTransformSettings]);

    return (
        <div className="flex flex-col h-full animate-in slide-in-from-bottom-2 duration-500">
            {/* Header Area */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                        {currentStep === 'data-source' ? 'Data Source Configuration' : 
                         currentStep === 'control-variable' ? 'Price Elasticity Analysis' :
                         'Facebook Spend Transformation'}
                    </h1>
                    <p className="text-sm font-semibold text-slate-500 mt-0.5">
                        {currentStep === 'data-source' ? 'Configure raw inputs and metric definitions' :
                         currentStep === 'control-variable' ? 'Configure pricing variables and discounts for sales impact' :
                         'Pipeline visualization and effects preview'}
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
                    {currentStep === 'adstock' && AdstockView}
                    {currentStep === 'saturation' && SaturationView}
                    {currentStep === 'control-variable' && ControlVariableView}
                    
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
                                                            onClick={() => setTransformSettings({ primaryMetric: metric.id as 'spend' | 'impressions' | 'clicks' })}
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
                                                        <div 
                                                            className="flex-1 relative cursor-pointer"
                                                            onClick={(e) => {
                                                                const input = e.currentTarget.querySelector('input');
                                                                if (input) (input as any).showPicker?.();
                                                            }}
                                                        >
                                                            <input 
                                                                type="date" 
                                                                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:border-[#871F1E] outline-none cursor-pointer"
                                                                value={transformSettings?.dateRange?.start ?? ''}
                                                                onChange={(e) => setTransformSettings({ dateRange: { ...transformSettings.dateRange, start: e.target.value } })}
                                                            />
                                                            <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                                        </div>
                                                        <div 
                                                            className="flex-1 relative cursor-pointer"
                                                            onClick={(e) => {
                                                                const input = e.currentTarget.querySelector('input');
                                                                if (input) (input as any).showPicker?.();
                                                            }}
                                                        >
                                                            <input 
                                                                type="date" 
                                                                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:border-[#871F1E] outline-none cursor-pointer"
                                                                value={transformSettings?.dateRange?.end ?? ''}
                                                                onChange={(e) => setTransformSettings({ dateRange: { ...transformSettings.dateRange, end: e.target.value } })}
                                                            />
                                                            <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Data Source Dropdown */}
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Data Source</label>
                                                    <div className="relative">
                                                        <select 
                                                            className="w-full appearance-none px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:border-[#871F1E] outline-none cursor-pointer"
                                                            value={transformSettings?.dataSource ?? 'All Sources'}
                                                            onChange={(e) => setTransformSettings({ dataSource: e.target.value })}
                                                        >
                                                            <option>All Sources</option>
                                                            {Array.from(new Set(rawData.map(row => String(row[mapping.channel || 'Channel'] || 'Unknown'))))
                                                                .filter(Boolean)
                                                                .sort()
                                                                .map(source => (
                                                                    <option key={source} value={source}>{source}</option>
                                                                ))
                                                            }
                                                        </select>
                                                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                    </div>
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
                            case 'control-variable':
                            return (
                                <div className="space-y-8 animate-in fade-in duration-500">
                                    {/* Base Metrics */}
                                    <div className="space-y-6">
                                        <div className="space-y-1">
                                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Base Metrics</h3>
                                            <p className="text-[10px] text-slate-400">Price and Volume source columns</p>
                                        </div>
                                        
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-700">Price Variable</label>
                                                <div className="relative">
                                                    <select 
                                                        className="w-full appearance-none px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:border-[#871F1E] outline-none cursor-pointer hover:border-slate-300 transition-colors"
                                                        value={transformSettings?.controlVariables?.baseMetrics?.priceVariable ?? 'Average Unit Price'}
                                                        onChange={(e) => setTransformSettings({ 
                                                            controlVariables: { 
                                                                ...(transformSettings?.controlVariables || { 
                                                                    baseMetrics: { priceVariable: 'Average Unit Price', volumeVariable: 'Units Sold' }, 
                                                                    promotions: { enabled: true, sensitivity: 'high' }, 
                                                                    timeEffects: { priceChangeLag: 2 } 
                                                                }),
                                                                baseMetrics: {
                                                                    ...(transformSettings?.controlVariables?.baseMetrics || { priceVariable: 'Average Unit Price', volumeVariable: 'Units Sold' }),
                                                                    priceVariable: e.target.value
                                                                }
                                                            } 
                                                        })}
                                                    >
                                                        <option>Average Unit Price</option>
                                                        <option>MSRP</option>
                                                        <option>Discounted Price</option>
                                                    </select>
                                                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-700">Volume Variable</label>
                                                <div className="relative">
                                                    <select 
                                                        className="w-full appearance-none px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:border-[#871F1E] outline-none cursor-pointer hover:border-slate-300 transition-colors"
                                                        value={transformSettings?.controlVariables?.baseMetrics?.volumeVariable ?? 'Units Sold'}
                                                        onChange={(e) => setTransformSettings({ 
                                                            controlVariables: { 
                                                                ...(transformSettings?.controlVariables || { 
                                                                    baseMetrics: { priceVariable: 'Average Unit Price', volumeVariable: 'Units Sold' }, 
                                                                    promotions: { enabled: true, sensitivity: 'high' }, 
                                                                    timeEffects: { priceChangeLag: 2 } 
                                                                }),
                                                                baseMetrics: {
                                                                    ...(transformSettings?.controlVariables?.baseMetrics || { priceVariable: 'Average Unit Price', volumeVariable: 'Units Sold' }),
                                                                    volumeVariable: e.target.value
                                                                }
                                                            } 
                                                        })}
                                                    >
                                                        <option>Units Sold</option>
                                                        <option>Total Conversions</option>
                                                        <option>Signups</option>
                                                    </select>
                                                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Promotions & Overlays */}
                                    <div className="space-y-6 pt-4 border-t border-slate-100">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Promotions & Overlays</h3>
                                            <div className={cn(
                                                "w-8 h-4 rounded-full relative transition-colors cursor-pointer",
                                                transformSettings?.controlVariables?.promotions?.enabled ? "bg-[#871F1E]" : "bg-slate-200"
                                            )} onClick={() => setTransformSettings({ 
                                                controlVariables: { 
                                                    ...(transformSettings?.controlVariables || { 
                                                        baseMetrics: { priceVariable: 'Average Unit Price', volumeVariable: 'Units Sold' }, 
                                                        promotions: { enabled: true, sensitivity: 'high' }, 
                                                        timeEffects: { priceChangeLag: 2 } 
                                                    }),
                                                    promotions: {
                                                        ...(transformSettings?.controlVariables?.promotions || { enabled: true, sensitivity: 'high' }),
                                                        enabled: !transformSettings?.controlVariables?.promotions?.enabled
                                                    }
                                                } 
                                            })}>
                                                <div className={cn(
                                                    "absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all",
                                                    transformSettings?.controlVariables?.promotions?.enabled ? "right-0.5" : "left-0.5"
                                                )}></div>
                                            </div>
                                        </div>

                                        <div className="bg-[#871F1E]/5 border border-[#871F1E]/10 rounded-xl p-4 flex gap-3">
                                            <div className="font-bold text-[#871F1E]">%</div>
                                            <p className="text-[10px] text-slate-600 leading-relaxed">
                                                Discounts are modeled as interaction effects on the base price elasticity.
                                            </p>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <label className="text-xs font-bold text-slate-700">Discount Sensitivity</label>
                                                <div className="px-2 py-0.5 border border-slate-200 rounded-md bg-white text-[10px] font-bold text-[#871F1E] capitalize">
                                                    {transformSettings?.controlVariables?.promotions?.sensitivity ?? 'High'}
                                                </div>
                                            </div>
                                            <input 
                                                type="range" min="0" max="2" step="1"
                                                value={transformSettings?.controlVariables?.promotions?.sensitivity === 'low' ? 0 : transformSettings?.controlVariables?.promotions?.sensitivity === 'medium' ? 1 : 2}
                                                onChange={(e) => {
                                                    const val = Number(e.target.value);
                                                    const sens = val === 0 ? 'low' : val === 1 ? 'medium' : 'high';
                                                    setTransformSettings({ 
                                                        controlVariables: { 
                                                            ...(transformSettings?.controlVariables || { 
                                                                baseMetrics: { priceVariable: 'Average Unit Price', volumeVariable: 'Units Sold' }, 
                                                                promotions: { enabled: true, sensitivity: 'high' }, 
                                                                timeEffects: { priceChangeLag: 2 } 
                                                            }),
                                                            promotions: {
                                                                ...(transformSettings?.controlVariables?.promotions || { enabled: true, sensitivity: 'high' }),
                                                                sensitivity: sens
                                                            }
                                                        } 
                                                    });
                                                }}
                                                className="w-full accent-[#871F1E] h-1.5"
                                            />
                                            <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase">
                                                <span>Low</span>
                                                <span className="pl-4">Medium</span>
                                                <span>High</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Time Effects */}
                                    <div className="space-y-6 pt-4 border-t border-slate-100">
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Time Effects</h3>
                                        
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <label className="text-xs font-bold text-slate-700">Price Change Lag (Weeks)</label>
                                                <div className="w-6 h-6 flex items-center justify-center border border-slate-200 rounded-md bg-white text-xs font-bold text-slate-900">
                                                    {transformSettings?.controlVariables?.timeEffects?.priceChangeLag ?? 2}
                                                </div>
                                            </div>
                                            <input 
                                                type="range" min="0" max="8" step="1"
                                                value={transformSettings?.controlVariables?.timeEffects?.priceChangeLag ?? 2}
                                                onChange={(e) => setTransformSettings({ 
                                                    controlVariables: { 
                                                        ...(transformSettings?.controlVariables || { 
                                                            baseMetrics: { priceVariable: 'Average Unit Price', volumeVariable: 'Units Sold' }, 
                                                            promotions: { enabled: true, sensitivity: 'high' }, 
                                                            timeEffects: { priceChangeLag: 2 } 
                                                        }),
                                                        timeEffects: {
                                                            ...(transformSettings?.controlVariables?.timeEffects || { priceChangeLag: 2 }),
                                                            priceChangeLag: Number(e.target.value)
                                                        }
                                                    } 
                                                })}
                                                className="w-full accent-[#871F1E] h-1.5"
                                            />
                                            <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase">
                                                <span>Immediate</span>
                                                <span>Delayed</span>
                                            </div>
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
