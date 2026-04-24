import { useEffect, useState } from 'react';
import { CheckCircle2, ChevronRight, Loader2 } from 'lucide-react';
import { useDataStore } from '../store/useDataStore';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const SuccessTransition = () => {
  const { setActivePage } = useDataStore();
  const [progress, setProgress] = useState(0);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Fade in content
    const fadeTimer = setTimeout(() => setShowContent(true), 100);

    // Progress bar simulation
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 40);

    // Auto-navigate after check
    const navigateTimer = setTimeout(() => {
      setActivePage('measure');
    }, 3000);

    return () => {
      clearTimeout(fadeTimer);
      clearInterval(interval);
      clearTimeout(navigateTimer);
    };
  }, [setActivePage]);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900 flex items-center justify-center overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-brand-primary/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px]" />
      </div>

      <div className={cn(
        "relative max-w-md w-full px-8 flex flex-col items-center text-center space-y-8 transition-all duration-1000 transform",
        showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
      )}>
        {/* Animated Checkmark */}
        <div className="relative">
          <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping scale-150 opacity-20" />
          <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-xl shadow-green-500/20 relative z-10 animate-in zoom-in duration-500">
            <CheckCircle2 className="text-white w-12 h-12" strokeWidth={3} />
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Data Initialized
          </h1>
          <p className="text-slate-400 font-medium leading-relaxed">
            Your marketing architecture is successfully mapped. The analytics engine is now processing your dataset in the background.
          </p>
        </div>

        {/* Custom Progress Bar */}
        <div className="w-full space-y-3">
          <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
            <span>Building Insights</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-brand-primary to-indigo-500 transition-all duration-300 ease-out rounded-full shadow-[0_0_10px_rgba(79,70,229,0.5)]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-500 font-bold flex items-center justify-center gap-2">
            <Loader2 size={10} className="animate-spin text-brand-primary" />
            CALIBRATING MODEL...
          </p>
        </div>

        <button 
          onClick={() => setActivePage('measure')}
          className="group flex items-center gap-2 text-white bg-slate-800 hover:bg-slate-700 px-6 py-3 rounded-xl font-bold transition-all active:scale-95 border border-slate-700"
        >
          Enter Dashboard
          <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};
