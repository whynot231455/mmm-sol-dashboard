import { useState, useEffect } from 'react';
import { Search, Users, Tv, MonitorPlay, Lock, RefreshCw, AlertCircle } from 'lucide-react';

interface SimulationSidebarProps {
  totalBudget: number;
  channelWeights: Record<string, number>;
  channels: string[];
  period: number;
  onBudgetChange: (value: number) => void;
  onWeightChange: (channel: string, value: number) => void;
  onPeriodChange: (period: number) => void;
  onApply: () => void;
  onReset: () => void;
}

const getChannelIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('search')) return <Search size={18} />;
  if (n.includes('social')) return <Users size={18} />;
  if (n.includes('tv')) return <Tv size={18} />;
  return <MonitorPlay size={18} />;
};

export const BudgetSimulationSidebar = ({ 
  totalBudget, 
  channelWeights, 
  channels,
  period,
  onBudgetChange,
  onWeightChange,
  onPeriodChange,
  onApply,
  onReset
}: SimulationSidebarProps) => {
  const [localBudget, setLocalBudget] = useState(totalBudget);

  // Sync local state when prop changes (e.g. from parent reset or initialization)
  useEffect(() => {
    setLocalBudget(totalBudget);
  }, [totalBudget]);

  const handleBudgetSubmit = () => {
    onBudgetChange(localBudget);
  };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm flex flex-col">
      <div className="p-6 border-b border-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600">
                <RefreshCw size={16} />
            </div>
            <h3 className="font-bold text-slate-900">Simulation</h3>
        </div>
        <button 
          onClick={onReset}
          className="text-xs font-bold text-brand-primary hover:underline"
        >
          Reset
        </button>
      </div>

      <div className="p-6 space-y-8 flex-1 overflow-y-auto">
        {/* Total Budget Input */}
        <div className="space-y-3">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Budget</label>
            <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
                <input 
                    type="text"
                    value={localBudget.toLocaleString()}
                    onChange={(e) => {
                        const val = Number(e.target.value.replace(/[^0-9]/g, ''));
                        setLocalBudget(val);
                    }}
                    onBlur={handleBudgetSubmit}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            handleBudgetSubmit();
                            onApply();
                        }
                    }}
                    className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all"
                />
            </div>
        </div>

        {/* Projection Period Selection */}
        <div className="space-y-3">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Projection Period</label>
            <div className="grid grid-cols-3 gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
                {[1, 4, 6].map((p) => (
                    <button
                        key={p}
                        onClick={() => onPeriodChange(p)}
                        className={cn(
                            "py-2 text-xs font-bold rounded-lg transition-all",
                            period === p 
                                ? "bg-white text-brand-primary shadow-sm ring-1 ring-slate-100" 
                                : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                        )}
                    >
                        {p} Mo{p > 1 ? 's' : ''}
                    </button>
                ))}
            </div>
        </div>

        {/* Channel Sliders */}
        <div className="space-y-6">
            {channels.map(channel => (
                <div key={channel} className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-600">
                           {getChannelIcon(channel)}
                           <span className="text-sm font-semibold">{channel}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={cn(
                                "text-xs font-bold px-2 py-0.5 rounded-md",
                                (channelWeights[channel] || 0) >= 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                            )}>
                                {(channelWeights[channel] || 0) >= 0 ? '+' : ''}{( (channelWeights[channel] || 0) * 100).toFixed(0)}%
                            </span>
                            <Lock size={14} className="text-slate-300 cursor-not-allowed" />
                        </div>
                    </div>
                    <input 
                        type="range"
                        min="-0.5"
                        max="0.5"
                        step="0.05"
                        value={channelWeights[channel] || 0}
                        onChange={(e) => onWeightChange(channel, parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-brand-primary"
                    />
                    <div className="flex justify-between text-[10px] font-bold text-slate-300 uppercase">
                        <span>-50%</span>
                        <span>0%</span>
                        <span>+50%</span>
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* Info Box */}
      <div className="p-4 bg-indigo-50/50 m-6 rounded-xl border border-indigo-100/50 flex gap-3">
         <AlertCircle size={18} className="text-brand-primary shrink-0" />
         <p className="text-xs text-brand-primary leading-relaxed font-medium">
            Reducing TV spend by {'>'}15% may negatively impact upper-funnel awareness for Search.
         </p>
      </div>
    </div>
  );
};

// Internal utility for tailwind classes if needed, or stick to template
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
