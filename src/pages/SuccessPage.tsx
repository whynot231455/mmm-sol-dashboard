import { useEffect } from 'react';
import { 
  CheckCircle2, 
  BarChart3, 
  TrendingUp, 
  Zap, 
  ArrowRight,
  Database,
  RefreshCw
} from 'lucide-react';
import { useDataStore } from '../store/useDataStore';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const SuccessPage = () => {
  const { setActivePage, rawData, setIsProcessing } = useDataStore();

  useEffect(() => {
    // Reset any processing states when entering success
    setIsProcessing(false);
  }, [setIsProcessing]);

  const stats = [
    { label: 'Rows Processed', value: rawData.length.toLocaleString(), icon: Database },
    { label: 'Data Quality', value: 'Excellent', icon: CheckCircle2 },
    { label: 'Schema Status', value: 'Validated', icon: Zap },
  ];

  const actions = [
    {
      id: 'measure',
      title: 'Analyze Performance',
      description: 'Explore ROI, attribution, and channel-level efficiency breakdowns.',
      icon: BarChart3,
      color: 'bg-indigo-500',
      lightColor: 'bg-indigo-50',
      textColor: 'text-indigo-600',
    },
    {
      id: 'predict',
      title: 'Run Simulations',
      description: 'Forecast future growth and run "what-if" scenarios for budget allocation.',
      icon: TrendingUp,
      color: 'bg-emerald-500',
      lightColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
    },
    {
      id: 'train',
      title: 'Train New Model',
      description: 'Optimize model parameters based on the latest imported data.',
      icon: Zap,
      color: 'bg-amber-500',
      lightColor: 'bg-amber-50',
      textColor: 'text-amber-600',
    },
  ];

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center py-12 px-4 animate-in fade-in duration-700">
      {/* Success Celebration Header */}
      <div className="text-center space-y-4 mb-16">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-green-50 rounded-full mb-6 relative">
          <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-25" />
          <CheckCircle2 className="w-12 h-12 text-green-500 relative z-10" />
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
          Dashboard Initialized!
        </h1>
        <p className="text-slate-500 text-lg max-w-xl mx-auto">
          Your marketing data has been successfully imported, mapped, and validated. 
          The SOL engine is ready to deliver insights.
        </p>
      </div>

      {/* Quick Stats Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl mb-16">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-xl font-bold text-slate-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Next Steps Grid */}
      <div className="w-full max-w-5xl">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-8 text-center">
          What would you like to do next?
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={() => setActivePage(action.id as Parameters<typeof setActivePage>[0])}
              className="group bg-white border border-slate-100 p-8 rounded-3xl text-left hover:shadow-xl hover:shadow-slate-200/50 hover:border-brand-primary/20 transition-all duration-300 relative overflow-hidden"
            >
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110", action.lightColor, action.textColor)}>
                <action.icon size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{action.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">
                {action.description}
              </p>
              <div className={cn("inline-flex items-center gap-2 font-bold text-sm", action.textColor)}>
                Get Started
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </div>
              
              {/* Decorative background element */}
              <div className={cn("absolute -right-4 -bottom-4 w-24 h-24 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity", action.textColor)}>
                <action.icon size={96} />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Secondary Action */}
      <div className="mt-16">
        <button 
          onClick={() => setActivePage('import')}
          className="flex items-center gap-2 px-6 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-sm font-bold transition-colors"
        >
          <RefreshCw size={18} />
          Import Different Dataset
        </button>
      </div>
    </div>
  );
};
