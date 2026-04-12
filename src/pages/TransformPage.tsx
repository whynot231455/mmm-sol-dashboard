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
    Zap,
    Sliders,
    SlidersHorizontal,
    Info,
    Activity
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

const CHANNEL_PRESETS: Record<string, { lag: number; decay: number; alpha: number; gamma: number }> = {
    'Meta': { lag: 1, decay: 0.5, alpha: 1.2, gamma: 40000 },
    'TV': { lag: 2, decay: 0.8, alpha: 1.5, gamma: 100000 },
    'OOH': { lag: 3, decay: 0.7, alpha: 1.0, gamma: 70000 }
};

// Read-only slider component for simulation UI
const SimSlider = ({ label, value, min, max, step, unit = '', onChange }: {
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    unit?: string;
    onChange?: (v: number) => void;
}) => {
    const pct = ((value - min) / (max - min)) * 100;
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-600">{label}</span>
                <span className="text-[11px] font-black text-[#871F1E] bg-[#871F1E]/5 px-2 py-0.5 rounded-md">
                    {value}{unit}
                </span>
            </div>
            <div className="relative">
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={onChange ? (e) => onChange(parseFloat(e.target.value)) : undefined}
                    className="w-full accent-[#871F1E] h-1.5 cursor-pointer"
                />
                <div
                    className="absolute -top-0.5 pointer-events-none h-2.5 rounded-l-full bg-gradient-to-r from-[#871F1E]/20 to-[#ED1B24]/30"
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
};

// Labelled stat badge
const StatBadge = ({ label, value, color = 'red' }: { label: string; value: string | number; color?: 'red' | 'green' | 'amber' }) => {
    const colors = {
        red: 'text-[#871F1E] bg-[#871F1E]/5',
        green: 'text-emerald-600 bg-emerald-50',
        amber: 'text-amber-600 bg-amber-50',
    };
    return (
        <div className="flex flex-col items-center px-5 py-3 rounded-2xl bg-white border border-slate-100 shadow-sm">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</span>
            <span className={cn("text-lg font-black rounded px-1", colors[color])}>{value}</span>
        </div>
    );
};

export const TransformPage = () => {
    const { 
        rawData, 
        mapping, 
        transformSettings, 
        setTransformSettings 
    } = useDataStore();
    
    const [currentStep, setCurrentStep] = useState<TransformationStep>('data-source');

    // Local simulation state (does not write to store, just for visual preview)
    const [simLag, setSimLag] = useState<number>(transformSettings?.adstock?.lag ?? 0);
    const [simDecay, setSimDecay] = useState<number>(transformSettings?.adstock?.decayRate ?? 0.65);
    const [simSlope, setSimSlope] = useState<number>(transformSettings?.saturation?.slope ?? 1.42);
    const [simInflection] = useState<number>(transformSettings?.saturation?.inflection ?? 0.5);
    const [simGamma, setSimGamma] = useState<number>(transformSettings?.saturation?.gamma ?? 50000);
    const [simSensitivity, setSimSensitivity] = useState<number>(
        transformSettings?.controlVariables?.promotions?.sensitivity === 'low' ? 0
        : transformSettings?.controlVariables?.promotions?.sensitivity === 'medium' ? 1 : 2
    );

    // Centralized filtering logic
    const filteredData = useMemo(() => {
        if (!rawData || rawData.length === 0) return [];
        
        const source = transformSettings?.dataSource || 'All Sources';
        const { start, end } = transformSettings?.dateRange || {};
        const channelKey = mapping?.channel || 'Channel';
        const dateKey = mapping?.date || 'Date';
        
        return rawData.filter(row => {
            const matchesSource = source === 'All Sources' || String(row[channelKey]) === source;
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

    // Chart data
    const chartData = useMemo(() => {
        if (!filteredData || filteredData.length === 0) return [];
        const metric = mapping?.[transformSettings?.primaryMetric] || transformSettings?.primaryMetric || 'spend';
        const dateKey = mapping?.date || 'Date';
        return filteredData.slice(0, 100).map((row, idx) => ({
            name: row[dateKey] || `Point ${idx}`,
            value: Number(row[metric]) || 0,
        }));
    }, [filteredData, mapping, transformSettings?.primaryMetric]);

    // Step 1: Lagged Data
    const laggedData = useMemo(() => {
        if (!filteredData || filteredData.length === 0) return [];
        const metric = mapping?.[transformSettings?.primaryMetric] || transformSettings?.primaryMetric || 'spend';
        const dateKey = mapping?.date || 'Date';
        
        return filteredData.slice(0, 50).map((row, idx, arr) => {
            const laggedIdx = idx - simLag;
            const raw = Number(row[metric]) || 0;
            const laggedValue = laggedIdx >= 0 ? Number(arr[laggedIdx][metric]) || 0 : 0;
            return {
                name: row[dateKey] || `Week ${idx}`,
                raw,
                lagged: laggedValue
            };
        });
    }, [filteredData, mapping, transformSettings?.primaryMetric, simLag]);

    // Step 2: Adstock data using lagged values
    const adstockData = useMemo(() => {
        if (!laggedData || laggedData.length === 0) return [];
        let adstockedValue = 0;
        return laggedData.map((row) => {
            adstockedValue = row.lagged + (adstockedValue * simDecay);
            return {
                ...row,
                adstock: adstockedValue
            };
        });
    }, [laggedData, simDecay]);

    // Step 3: Saturation data using adstocked values
    const saturationData = useMemo(() => {
        const hill = (x: number) => {
            const xs = Math.pow(x, simSlope);
            const ks = Math.pow(simGamma, simSlope);
            if (xs + ks === 0) return 0;
            return xs / (xs + ks);
        };

        if (!adstockData || adstockData.length === 0) return [];

        return adstockData.map(row => {
            const saturated = hill(row.adstock);
            return {
                ...row,
                saturated: saturated,
                // scaled for plotting comparison
                saturatedDisplay: saturated * simGamma * 1.5 
            };
        });
    }, [adstockData, simSlope, simGamma]);

    // For the saturation curve plot (response curve)
    const responseCurveData = useMemo(() => {
        const hill = (x: number) => {
            const xs = Math.pow(x, simSlope);
            const ks = Math.pow(simGamma, simSlope);
            if (xs + ks === 0) return 0;
            return xs / (xs + ks);
        };
        
        // Find max adstock to define x-axis range
        const maxAdstock = adstockData.length > 0 ? Math.max(...adstockData.map(d => d.adstock), simGamma * 2) : simGamma * 2;
        
        return Array.from({ length: 50 }).map((_, idx) => {
            const x = (idx / 49) * maxAdstock;
            return {
                x: x,
                curve: hill(x),
            };
        });
    }, [adstockData, simSlope, simGamma]);

    // Control variable data
    const controlVariableData = useMemo(() => {
        if (!filteredData || filteredData.length === 0) return [];
        const dateKey = mapping?.date || 'Date';
        const sensitivityMultiplier = simSensitivity === 0 ? -0.8 : simSensitivity === 1 ? -1.4 : -1.8;
        return filteredData.slice(0, 50).map((row, idx) => {
            const basePrice = 50 + Math.sin(idx / 5) * 10;
            const seasonalEffect = Math.cos(idx / 8) * 5;
            const discount = (idx === 15 || idx === 35) ? 15 : 0;
            const finalPrice = basePrice + seasonalEffect - discount;
            const volumeChange = ((finalPrice - 50) / 50) * sensitivityMultiplier;
            const volume = 1000 * (1 + volumeChange);
            return {
                name: row[dateKey] || `Week ${idx}`,
                price: finalPrice,
                volume: volume,
                isDiscount: discount > 0,
            };
        });
    }, [filteredData, mapping?.date, simSensitivity]);

    return (
        <div className="flex flex-col h-full animate-in slide-in-from-bottom-2 duration-500">
            {/* Header Area */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                        {currentStep === 'data-source' ? 'Data Source' : 
                         currentStep === 'adstock' ? 'Adstock Decay' :
                         currentStep === 'saturation' ? 'Saturation Response' :
                         currentStep === 'control-variable' ? 'Price Elasticity Analysis' :
                         'Final Model Input'}
                    </h1>
                    <p className="text-sm font-semibold text-slate-500 mt-0.5">
                        {currentStep === 'data-source' ? 'Raw signal preview and channel breakdown' :
                         currentStep === 'adstock' ? 'Carryover effect and decay simulation' :
                         currentStep === 'saturation' ? 'Response curve and efficiency modeling' :
                         currentStep === 'control-variable' ? 'Price-volume dynamics and promotional effects' :
                         'Transformed signal ready for modeling'}
                    </p>
                </div>
                <div className="flex items-center gap-3">
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

            {/* Full-width Visualizer */}
            <div className="flex-1">
                {currentStep === 'data-source' && (
                    <DataSourceView 
                        rawData={rawData}
                        mapping={mapping}
                        transformSettings={transformSettings}
                        chartData={chartData}
                        filteredData={filteredData}
                        setTransformSettings={setTransformSettings}
                        setSimLag={setSimLag}
                        setSimDecay={setSimDecay}
                        setSimSlope={setSimSlope}
                        setSimGamma={setSimGamma}
                    />
                )}
                {currentStep === 'adstock' && (
                    <AdstockView 
                        adstockData={adstockData}
                        simLag={simLag}
                        simDecay={simDecay}
                        setSimLag={setSimLag}
                        setSimDecay={setSimDecay}
                        metrics={transformSettings?.metrics}
                    />
                )}
                {currentStep === 'saturation' && (
                    <SaturationView 
                        responseCurveData={responseCurveData}
                        saturationData={saturationData}
                        simSlope={simSlope}
                        simGamma={simGamma}
                        simInflection={simInflection}
                        setSimSlope={setSimSlope}
                        setSimGamma={setSimGamma}
                        saturationSettings={transformSettings?.saturation}
                        setTransformSettings={setTransformSettings}
                    />
                )}
                {currentStep === 'control-variable' && (
                    <ControlVariableView 
                        controlVariableData={controlVariableData}
                        simSensitivity={simSensitivity}
                        setSimSensitivity={setSimSensitivity}
                    />
                )}
                {currentStep === 'final-input' && (
                    <FinalInputView 
                        saturationData={saturationData}
                        filteredData={filteredData}
                        rawData={rawData}
                        mapping={mapping}
                    />
                )}
            </div>
        </div>
    );
};

// ------ SUB-COMPONENTS ------

const DataSourceView = ({ 
    rawData, 
    mapping, 
    transformSettings, 
    chartData, 
    filteredData, 
    setTransformSettings,
    setSimLag,
    setSimDecay,
    setSimSlope,
    setSimGamma 
}: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    const channels: string[] = Array.from(new Set(rawData.map((row: any) => String(row[mapping.channel || 'Channel'] || 'Unknown')))).filter(Boolean).sort() as string[]; // eslint-disable-line @typescript-eslint/no-explicit-any
    
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 bg-gradient-to-r from-[#871F1E]/5 to-transparent border border-[#871F1E]/10 rounded-2xl px-5 py-3">
                <Activity size={16} className="text-[#ED1B24] shrink-0" />
                <p className="text-[11px] font-bold text-slate-600">
                    <span className="text-[#871F1E]">Data Source</span> — Select metric and channel to preview how raw signals feed into the model.
                </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#871F1E]"></div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            Raw {transformSettings?.primaryMetric ?? 'spend'} Signal
                        </span>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
                        {['spend', 'impressions', 'clicks'].map(m => (
                            <button
                                key={m}
                                onClick={() => setTransformSettings({ primaryMetric: m as 'spend' | 'impressions' | 'clicks' })}
                                className={cn(
                                    "px-3 py-1.5 text-[10px] font-black rounded-lg transition-all capitalize",
                                    transformSettings?.primaryMetric === m
                                        ? "bg-[#871F1E] text-white shadow-sm"
                                        : "text-slate-400 hover:text-slate-700"
                                )}
                            >
                                {m}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontWeight: 600 }} />
                            <YAxis hide />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                labelStyle={{ fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}
                                itemStyle={{ color: '#1e293b', fontWeight: 600, textTransform: 'capitalize' }}
                                formatter={(value: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
                                    const label = transformSettings?.primaryMetric === 'spend' ? 'Spend' : transformSettings?.primaryMetric === 'impressions' ? 'Impressions' : 'Clicks';
                                    return [`$${Number(value).toLocaleString()}`, label];
                                }}
                            />
                            <Bar dataKey="value" fill="#871F1E10" radius={[4, 4, 0, 0]} barSize={12} tooltipType="none" />
                            <Line type="monotone" dataKey="value" stroke="#871F1E" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: '#871F1E', strokeWidth: 2, stroke: '#fff' }} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Channel Breakdown</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {['All Sources', ...channels.slice(0, 5)].map(ch => {
                        const isActive = (transformSettings?.dataSource ?? 'All Sources') === ch;
                        return (
                            <button
                                key={ch}
                                onClick={() => {
                                    setTransformSettings({ dataSource: ch });
                                    const preset = CHANNEL_PRESETS[ch as string];
                                    if (preset) {
                                        setSimLag(preset.lag);
                                        setSimDecay(preset.decay);
                                        setSimSlope(preset.alpha);
                                        setSimGamma(preset.gamma);
                                        setTransformSettings({
                                            adstock: { ...transformSettings.adstock, lag: preset.lag, decayRate: preset.decay },
                                            saturation: { ...transformSettings.saturation, slope: preset.alpha, gamma: preset.gamma }
                                        });
                                    }
                                }}
                                className={cn(
                                    "p-4 rounded-xl border transition-all text-left group",
                                    isActive
                                        ? "bg-[#871F1E] border-[#871F1E] shadow-lg shadow-[#871F1E]/20"
                                        : "bg-white border-slate-100 hover:border-slate-300"
                                )}
                            >
                                <div className={cn("text-[10px] font-black uppercase tracking-widest mb-1", isActive ? "text-white/60" : "text-slate-400")}>
                                    {ch === 'All Sources' ? 'All' : 'Channel'}
                                </div>
                                <div className={cn("text-xs font-bold truncate", isActive ? "text-white" : "text-slate-700")}>
                                    {ch}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
                    <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest">Raw Data Preview</h3>
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
                                    <th key={header} className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{header}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredData.slice(0, 8).map((row: any, idx: number) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-3 text-xs font-semibold text-slate-600">{String(row[mapping.date || 'Date'] || '2023-01-01')}</td>
                                    <td className="px-6 py-3 text-xs font-semibold text-slate-600">{String(row[mapping.channel || 'Channel'] || 'Facebook Ads')}</td>
                                    <td className="px-6 py-3 text-xs font-bold text-slate-900">${Number(row[mapping.spend || 'Spend']).toLocaleString()}</td>
                                    <td className="px-6 py-3 text-xs font-semibold text-slate-600">{Number(row['Impressions'] || 1240000).toLocaleString()}</td>
                                    <td className="px-6 py-3 text-xs font-semibold text-slate-600">{Number(row['Clicks'] || 14200).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const AdstockView = ({ adstockData, simLag, simDecay, setSimLag, setSimDecay, metrics }: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    const halfLife = Math.round(-1 / Math.log2(simDecay || 0.5));
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 bg-gradient-to-r from-[#871F1E]/5 to-transparent border border-[#871F1E]/10 rounded-2xl px-5 py-3">
                <SlidersHorizontal size={16} className="text-[#ED1B24] shrink-0" />
                <p className="text-[11px] font-bold text-slate-600">
                    <span className="text-[#871F1E]">Simulation Mode</span> — Drag the slider to see how different decay rates affect the adstock curve in real time.
                </p>
            </div>

            <div className="flex gap-4">
                <StatBadge label="Decay Rate (α)" value={simDecay} color="red" />
                <StatBadge label="Est. Half-life" value={`${halfLife} wks`} color="amber" />
                <StatBadge label="R²" value={metrics?.r2 ?? 0} color="green" />
                <StatBadge label="VIF" value={metrics?.vif ?? 0} color="green" />
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
                <div className="flex items-center gap-2 mb-1">
                    <Sliders size={14} className="text-[#871F1E]" />
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Decay Simulation</span>
                    <span className="ml-auto text-[9px] font-bold bg-[#ED1B24]/10 text-[#ED1B24] px-2 py-0.5 rounded uppercase">Geometric</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-5">
                        <SimSlider
                            label="Time Lag (Weeks) — Delayed impact"
                            value={simLag}
                            min={0}
                            max={12}
                            step={1}
                            onChange={setSimLag}
                        />
                        <SimSlider
                            label="Decay Rate (α) — Carryover effect"
                            value={simDecay}
                            min={0.0}
                            max={1.0}
                            step={0.01}
                            onChange={setSimDecay}
                        />
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4 flex flex-col justify-center gap-2">
                        <div className="flex items-start gap-2">
                            <Info size={13} className="text-slate-400 mt-0.5 shrink-0" />
                            <p className="text-[10px] text-slate-500 leading-relaxed">
                                A lag of <strong>{simLag} weeks</strong> followed by a decay of <strong>{simDecay}</strong> means the ad impact starts {simLag} weeks later and {Math.round(simDecay * 100)}% carries over each week.
                            </p>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-2">
                            Half-life: <span className="text-[#871F1E]">{halfLife} weeks</span>
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <div className="flex items-center gap-4 mb-6">
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-slate-200"></div><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Raw Spend</span></div>
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-400"></div><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lagged Signal</span></div>
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#ED1B24]"></div><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Adstock Decay</span></div>
                </div>
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={adstockData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                            <XAxis dataKey="name" hide />
                            <YAxis hide />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                labelStyle={{ fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}
                                itemStyle={{ color: '#1e293b', fontWeight: 600 }}
                                formatter={(value: any, name: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
                                    const labels: Record<string, string> = {
                                        raw: 'Raw Spend',
                                        lagged: 'Lagged Signal',
                                        adstock: 'Adstock Decay'
                                    };
                                    return [`$${Number(value).toLocaleString()}`, labels[name] || name];
                                }}
                            />
                            <Bar dataKey="raw" fill="#f1f5f9" radius={[4, 4, 0, 0]} barSize={20} />
                            <Line type="monotone" dataKey="lagged" stroke="#fbbf24" strokeWidth={2} dot={false} strokeDasharray="3 3" />
                            <Line type="monotone" dataKey="adstock" stroke="#ED1B24" strokeWidth={3} dot={false} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

const SaturationView = ({ 
    responseCurveData, 
    simSlope, 
    simGamma, 
    setSimSlope, 
    setSimGamma, 
    saturationSettings, 
    setTransformSettings,
    simInflection 
}: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 bg-gradient-to-r from-[#871F1E]/5 to-transparent border border-[#871F1E]/10 rounded-2xl px-5 py-3">
                <SlidersHorizontal size={16} className="text-[#ED1B24] shrink-0" />
                <p className="text-[11px] font-bold text-slate-600">
                    <span className="text-[#871F1E]">Simulation Mode</span> — Explore how slope and inflection point shape the saturation response curve.
                </p>
            </div>

            <div className="flex gap-4">
                <StatBadge label="Saturation Point" value="82%" color="red" />
                <StatBadge label="Efficiency Score" value="High" color="green" />
                <StatBadge label="Curve Type" value={saturationSettings?.curveType ?? 'hill'} color="amber" />
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
                <div className="flex items-center gap-2 mb-1">
                    <Sliders size={14} className="text-[#871F1E]" />
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Response Curve Simulation</span>
                    <div className="ml-auto flex items-center gap-1 bg-slate-50 border border-slate-100 p-1 rounded-xl">
                        {['hill', 's-curve', 'power'].map(curve => (
                            <button
                                key={curve}
                                onClick={() => setTransformSettings({ saturation: { ...(saturationSettings || { active: true, curveType: 'hill', slope: simSlope, inflection: simInflection }), curveType: curve as 'hill' | 's-curve' | 'power' } })}
                                className={cn(
                                    "px-3 py-1 text-[10px] font-bold rounded-lg transition-all capitalize",
                                    (saturationSettings?.curveType ?? 'hill') === curve ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                {curve}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-6">
                        <SimSlider label="Alpha (Slope) — Shape of curves" value={simSlope} min={0.1} max={5} step={0.1} onChange={setSimSlope} />
                        <SimSlider label="Gamma (Scale) — Inflection point" value={simGamma} min={1000} max={200000} step={1000} onChange={setSimGamma} />
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4 flex flex-col justify-center gap-2">
                        <div className="flex items-start gap-2">
                            <Info size={13} className="text-slate-400 mt-0.5 shrink-0" />
                            <p className="text-[10px] text-slate-500 leading-relaxed">
                                <strong>Hill Function</strong>: Diminishing returns are modeled using Alpha (slope) and Gamma (inflection). 
                                With Gamma = <strong>${simGamma.toLocaleString()}</strong>, efficiency is halved at this spend level.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 relative">
                <div className="flex items-center gap-4 mb-6">
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#ED1B24]"></div><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Response Curve</span></div>
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-slate-200"></div><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Observed Spend</span></div>
                </div>
                <div className="h-[400px] w-full relative">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -rotate-90 origin-left text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] pointer-events-none">
                        Incremental Revenue
                    </div>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] pointer-events-none">
                        Media Spend
                    </div>
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={responseCurveData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <CartesianGrid strokeDasharray="2 2" stroke="#f1f5f9" />
                            <XAxis dataKey="x" hide />
                            <YAxis hide />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                formatter={(value: any, name: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
                                    if (name === 'curve') return [`${(Number(value) * 100).toFixed(1)}%`, 'Efficiency'];
                                    return [`$${Number(value).toLocaleString()}`, 'Spend'];
                                }}
                            />
                            <Area type="monotone" dataKey="curve" stroke="#ED1B24" strokeWidth={3} fill="url(#colorCurve)" dot={false} />
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
        </div>
    );
};

const ControlVariableView = ({ controlVariableData, simSensitivity, setSimSensitivity }: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    const sensLabel = simSensitivity === 0 ? 'Low (-0.8)' : simSensitivity === 1 ? 'Medium (-1.4)' : 'High (-1.8)';
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 bg-gradient-to-r from-[#871F1E]/5 to-transparent border border-[#871F1E]/10 rounded-2xl px-5 py-3">
                <SlidersHorizontal size={16} className="text-[#ED1B24] shrink-0" />
                <p className="text-[11px] font-bold text-slate-600">
                    <span className="text-[#871F1E]">Simulation Mode</span> — Slide the discount sensitivity to observe its effect on price-volume dynamics.
                </p>
            </div>

            <div className="flex gap-4">
                <StatBadge label="Price Elasticity" value={sensLabel.split(' ')[0]} color="red" />
                <StatBadge label="Sensitivity" value={sensLabel.split(' ')[1] ?? ''} color="amber" />
                <StatBadge label="Avg Discount" value="15%" color="green" />
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
                <div className="flex items-center gap-2 mb-1">
                    <Sliders size={14} className="text-[#871F1E]" />
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Price Sensitivity Simulation</span>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-600">Discount Sensitivity</span>
                        <span className={cn(
                            "text-[11px] font-black px-2 py-0.5 rounded-md",
                            simSensitivity === 0 ? "bg-emerald-50 text-emerald-600" :
                            simSensitivity === 1 ? "bg-amber-50 text-amber-600" :
                            "bg-[#871F1E]/5 text-[#871F1E]"
                        )}>
                            {simSensitivity === 0 ? 'Low' : simSensitivity === 1 ? 'Medium' : 'High'}
                        </span>
                    </div>
                    <input
                        type="range" min={0} max={2} step={1}
                        value={simSensitivity}
                        onChange={(e) => setSimSensitivity(Number(e.target.value))}
                        className="w-full accent-[#871F1E] h-1.5 cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase">
                        <span>Low Impact</span>
                        <span>Medium</span>
                        <span>High Impact</span>
                    </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 flex items-start gap-2">
                    <Info size={13} className="text-slate-400 mt-0.5 shrink-0" />
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                        <strong>{simSensitivity === 0 ? 'Low' : simSensitivity === 1 ? 'Medium' : 'High'}</strong> sensitivity means each 1% price change results in a <strong>{sensLabel.split(' ')[0]}%</strong> volume change. Discounts are modeled as interaction effects.
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 relative">
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
                </div>
                <div className="h-[400px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={controlVariableData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontWeight: 600 }} />
                            <YAxis yAxisId="left" label={{ value: 'PRICE ($)', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#94a3b8', fontWeight: 800, offset: 0 }} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                            <YAxis yAxisId="right" orientation="right" hide />
                            <Tooltip
                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                labelStyle={{ fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}
                                itemStyle={{ fontWeight: 600, fontSize: '11px' }}
                                formatter={(value: any, name: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
                                    if (name === 'price') return [`$${Number(value ?? 0).toFixed(2)}`, 'Avg Price'];
                                    if (name === 'volume') return [Math.round(Number(value ?? 0)).toLocaleString(), 'Volume'];
                                    return [String(value ?? ''), String(name ?? '')];
                                }}
                            />
                            <Line yAxisId="left" type="monotone" dataKey="price" stroke="#871F1E" strokeWidth={3} dot={false} />
                            <Line yAxisId="right" type="monotone" dataKey="volume" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                        </ComposedChart>
                    </ResponsiveContainer>

                    <div className="absolute top-[30%] left-[30%] h-[40%] w-[8%] border-x border-[#F59E0B]/30 bg-[#F59E0B]/5 flex flex-col justify-center items-center gap-1 pointer-events-none">
                        <div className="text-[9px] font-black text-[#F59E0B] -rotate-90 whitespace-nowrap">BLACK FRI</div>
                    </div>
                    <div className="absolute top-[30%] left-[70%] h-[40%] w-[8%] border-x border-[#F59E0B]/30 bg-[#F59E0B]/5 flex flex-col justify-center items-center gap-1 pointer-events-none">
                        <div className="text-[9px] font-black text-[#F59E0B] -rotate-90 whitespace-nowrap">SUMMER</div>
                    </div>

                    <div className="absolute top-4 right-4 bg-white border border-slate-100 shadow-xl shadow-slate-200/50 rounded-2xl p-4 w-44 space-y-3">
                        <div>
                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Price Elasticity</div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-black text-[#871F1E]">{sensLabel.split(' ')[0]}</span>
                                <span className="text-[9px] font-bold text-slate-400">{simSensitivity === 0 ? 'low sens.' : simSensitivity === 1 ? 'med sens.' : 'high sens.'}</span>
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
                <div className="mt-4 text-center text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">Time (Weeks)</div>
            </div>
        </div>
    );
};

const FinalInputView = ({ saturationData, filteredData, rawData, mapping }: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    return (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-slate-200"></div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Raw Signal</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#ED1B24]"></div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Transformed Input (Model Ready)</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1 rounded-full">
                        <Zap size={12} className="text-emerald-500" />
                        <span className="text-[10px] font-black text-emerald-600 uppercase">Stationary Ready</span>
                    </div>
                </div>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={saturationData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                            <XAxis dataKey="name" hide />
                            <YAxis hide />
                            <Tooltip
                                content={({ active, payload, label }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50 space-y-2">
                                                <p className="text-[11px] font-black text-slate-900 mb-2 uppercase tracking-wider">{label}</p>
                                                {payload.map((item: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                                                    <div key={item.dataKey} className="flex items-center justify-between gap-6">
                                                        <span className={cn(
                                                            "text-[10px] font-bold uppercase",
                                                            item.dataKey === 'raw' ? "text-slate-500" : "text-[#ED1B24]"
                                                        )}>
                                                            {item.dataKey === 'raw' ? 'Raw Spend' : 'Model Input'}
                                                        </span>
                                                        <span className={cn(
                                                            "text-xs font-black",
                                                            item.dataKey === 'raw' ? "text-slate-700" : "text-[#ED1B24]"
                                                        )}>
                                                            {item.dataKey === 'raw' ? `$${Number(item.value).toLocaleString()}` : Number(item.value).toFixed(4)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Bar dataKey="raw" fill="#f1f5f9" radius={[4, 4, 0, 0]} barSize={24} />
                            <Line type="monotone" dataKey="saturated" stroke="#ED1B24" strokeWidth={3} dot={false} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center space-y-4">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                    <Zap size={32} />
                </div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Final Model Input</h2>
                <p className="text-slate-500 max-w-sm mx-auto text-sm font-medium">
                    All transformations applied. The processed signal is ready for model training.
                </p>
                <div className="flex justify-center gap-4 pt-4">
                    <StatBadge label="Records" value={filteredData.length.toLocaleString()} color="green" />
                    <StatBadge label="Channels" value={Array.from(new Set(rawData.map((r: any) => String(r[mapping.channel || 'Channel'])))).length} color="amber" /> { /* eslint-disable-line @typescript-eslint/no-explicit-any */}
                    <StatBadge label="Status" value="Ready" color="green" />
                </div>
            </div>
        </div>
    );
};
