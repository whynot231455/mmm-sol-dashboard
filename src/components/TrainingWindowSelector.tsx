import { Calendar, ChevronDown, CalendarDays } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { CalendarRangePicker } from './CalendarRangePicker';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TrainingWindowSelectorProps {
  startDate: string;
  endDate: string;
  minDate?: string;
  maxDate?: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
}

export const TrainingWindowSelector = ({
  startDate,
  endDate,
  minDate = '',
  maxDate = '',
  onStartDateChange,
  onEndDateChange
}: TrainingWindowSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (start: string, end: string) => {
    onStartDateChange(start);
    onEndDateChange(end);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-primary/10 rounded-xl flex items-center justify-center">
              <Calendar size={20} className="text-brand-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Training Window</h3>
              <p className="text-xs text-slate-500 font-medium tracking-tight">Select active modeling period</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-full flex items-center justify-between px-6 py-5 bg-slate-50 border border-slate-200 rounded-[1.5rem] group hover:border-brand-primary/30 transition-all text-left relative overflow-hidden",
            isOpen && "ring-2 ring-brand-primary/10 border-brand-primary/20 bg-white"
          )}
        >
          <div className="flex items-center gap-4 relative z-10">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Date Range</p>
              <p className="text-sm font-black text-slate-700">
                {startDate ? `${startDate} — ${endDate}` : 'Select Training Period'}
              </p>
            </div>
          </div>
          <div className={cn(
            "w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300",
            isOpen ? "bg-brand-primary/10 text-brand-primary" : "text-slate-300"
          )}>
            <ChevronDown size={20} className={cn("transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1)", isOpen && "rotate-180")} />
          </div>
        </button>

        {isOpen && (
          <div className="relative z-[60]">
            <CalendarRangePicker
                startDate={startDate}
                endDate={endDate}
                minDate={minDate}
                maxDate={maxDate}
                onSelect={handleSelect}
                onClose={() => setIsOpen(false)}
            />
          </div>
        )}

        {startDate && endDate && (
          <div className="flex items-center gap-3 text-[10px] text-indigo-600 bg-indigo-50/50 px-4 py-3 rounded-xl border border-indigo-100/50 animate-in fade-in slide-in-from-bottom-1 duration-500">
            <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-pulse" />
                <span className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-pulse delay-75" />
                <span className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-pulse delay-150" />
            </div>
            <p className="font-bold uppercase tracking-wider">Dataset constraint active: {startDate} to {endDate}</p>
          </div>
        )}
      </div>
    </div>
  );
};
