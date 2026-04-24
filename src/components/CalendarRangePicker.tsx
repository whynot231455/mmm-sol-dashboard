import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Helper functions moved outside to prevent re-creation on every render
const parseISO = (s: string) => {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const formatISO = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface CalendarRangePickerProps {
  startDate: string;
  endDate: string;
  minDate: string;
  maxDate: string;
  onSelect: (start: string, end: string) => void;
  onClose: () => void;
}

export const CalendarRangePicker = ({
  startDate,
  endDate,
  minDate,
  maxDate,
  onSelect,
  onClose
}: CalendarRangePickerProps) => {
  const startObj = useMemo(() => parseISO(startDate), [startDate]);
  const endObj = useMemo(() => parseISO(endDate), [endDate]);
  const minObj = useMemo(() => parseISO(minDate), [minDate]);
  const maxObj = useMemo(() => parseISO(maxDate), [maxDate]);

  // Default to startDate month if available, otherwise current date
  const [viewDate, setViewDate] = useState(() => startObj || new Date());
  const [tempSelection, setTempSelection] = useState<Date | null>(null);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'days' | 'months' | 'years'>('days');

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const prevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const years = useMemo(() => {
    const currentYear = viewDate.getFullYear();
    const startYear = currentYear - 5;
    return Array.from({ length: 12 }, (_, i) => startYear + i);
  }, [viewDate]);

  const handleDateClick = (d: Date) => {
    if (minObj && d < minObj) return;
    if (maxObj && d > maxObj) return;

    if (!tempSelection) {
      setTempSelection(d);
    } else {
      const start = d < tempSelection ? d : tempSelection;
      const end = d < tempSelection ? tempSelection : d;
      onSelect(formatISO(start), formatISO(end));
      setTempSelection(null);
    }
  };

  const isSelected = (d: Date) => {
    if (tempSelection) {
      return d.getTime() === tempSelection.getTime();
    }
    if (startObj && endObj) {
      return d.getTime() === startObj.getTime() || d.getTime() === endObj.getTime();
    }
    return false;
  };

  const isBetween = (d: Date) => {
    if (tempSelection && hoverDate) {
      const start = tempSelection < hoverDate ? tempSelection : hoverDate;
      const end = tempSelection < hoverDate ? hoverDate : tempSelection;
      return d > start && d < end;
    }
    if (startObj && endObj) {
      return d > startObj && d < endObj;
    }
    return false;
  };

  const isAvailable = (d: Date) => {
    if (!minObj || !maxObj) return true;
    return d >= minObj && d <= maxObj;
  };

  const isMonthAvailable = (year: number, month: number) => {
    if (!minObj || !maxObj) return true;
    const date = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    return lastDay >= minObj && date <= maxObj;
  };

  const isYearAvailable = (year: number) => {
    if (!minObj || !maxObj) return true;
    return year >= minObj.getFullYear() && year <= maxObj.getFullYear();
  };

  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const numDays = daysInMonth(year, month);
    const firstDay = firstDayOfMonth(year, month);
    
    const days = [];
    // Padding for first week
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    // Days of month
    for (let i = 1; i <= numDays; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  }, [viewDate]);

  const presets = [
    { label: 'Full Dataset', range: [minDate, maxDate] },
    { 
        label: 'Last 3 Months', 
        range: maxDate ? [
            formatISO(new Date(new Date(maxDate).setMonth(new Date(maxDate).getMonth() - 3))),
            maxDate
        ] : null 
    },
    { 
        label: 'Last 6 Months', 
        range: maxDate ? [
            formatISO(new Date(new Date(maxDate).setMonth(new Date(maxDate).getMonth() - 6))),
            maxDate
        ] : null 
    }
  ];

  return (
    <div className="absolute top-full left-0 mt-3 z-50 bg-white/90 backdrop-blur-xl border border-slate-200/60 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] p-6 w-[360px] animate-in fade-in slide-in-from-top-2 duration-300 ring-1 ring-slate-900/5">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Select Training Window</h4>
        <button 
          onClick={onClose} 
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all active:scale-90"
        >
          <X size={18} />
        </button>
      </div>

      {/* Calendar Header with Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button 
          onClick={
            viewMode === 'years' ? () => setViewDate(new Date(viewDate.getFullYear() - 10, 0, 1)) : 
            viewMode === 'months' ? () => setViewDate(new Date(viewDate.getFullYear() - 1, viewDate.getMonth(), 1)) :
            prevMonth
          } 
          className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 transition-all"
        >
          <ChevronLeft size={20} />
        </button>
        
        <button 
          onClick={() => {
            if (viewMode === 'days') setViewMode('months');
            else if (viewMode === 'months') setViewMode('years');
            else setViewMode('days');
          }}
          className="text-sm font-black text-slate-900 hover:text-brand-primary active:scale-95 px-4 py-2 rounded-xl transition-all hover:bg-brand-primary/5"
        >
          {viewMode === 'days' && `${MONTHS[viewDate.getMonth()]} ${viewDate.getFullYear()}`}
          {viewMode === 'months' && `${viewDate.getFullYear()}`}
          {viewMode === 'years' && `${years[0]} - ${years[years.length - 1]}`}
        </button>

        <button 
          onClick={
            viewMode === 'years' ? () => setViewDate(new Date(viewDate.getFullYear() + 10, 0, 1)) : 
            viewMode === 'months' ? () => setViewDate(new Date(viewDate.getFullYear() + 1, viewDate.getMonth(), 1)) :
            nextMonth
          } 
          className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 transition-all"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="min-h-[220px]">
        {viewMode === 'days' && (
          <div className="animate-in fade-in zoom-in-95 duration-200">
            {/* Weekdays */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <div key={day} className="text-[10px] font-black text-slate-400 text-center py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1" onMouseLeave={() => setHoverDate(null)}>
              {calendarDays.map((date, i) => {
                if (!date) return <div key={`empty-${i}`} className="p-2" />;
                
                const available = isAvailable(date);
                const selected = isSelected(date);
                const between = isBetween(date);

                return (
                  <button
                    key={date.toISOString()}
                    disabled={!available}
                    onClick={() => handleDateClick(date)}
                    onMouseEnter={() => available && setHoverDate(date)}
                    className={cn(
                      "group p-2 text-xs font-bold rounded-xl transition-all relative z-10 overflow-hidden",
                      available ? "text-slate-700 hover:bg-slate-100 active:scale-95" : "text-slate-200 cursor-not-allowed",
                      selected && "bg-brand-primary text-white hover:bg-brand-primary shadow-xl shadow-brand-primary/30 ring-2 ring-white",
                      between && "bg-brand-primary/10 text-brand-primary rounded-none first:rounded-l-xl last:rounded-r-xl"
                    )}
                  >
                    <span className="relative z-10">{date.getDate()}</span>
                    {selected && (
                        <div className="absolute inset-0 bg-gradient-to-tr from-brand-primary to-brand-primary/80" />
                    )}
                    {available && !selected && !between && (
                      <div className="absolute inset-0 scale-0 group-hover:scale-100 bg-brand-primary/5 transition-transform duration-300 rounded-xl" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {viewMode === 'months' && (
          <div className="grid grid-cols-3 gap-2 animate-in fade-in zoom-in-95 duration-300">
            {SHORT_MONTHS.map((m, idx) => {
              const available = isMonthAvailable(viewDate.getFullYear(), idx);
              const isCurrent = viewDate.getMonth() === idx;
              return (
                <button
                  key={m}
                  disabled={!available}
                  onClick={() => {
                    setViewDate(new Date(viewDate.getFullYear(), idx, 1));
                    setViewMode('days');
                  }}
                  className={cn(
                    "py-6 text-xs font-black uppercase tracking-widest rounded-2xl border transition-all active:scale-95",
                    available ? "text-slate-700 hover:border-brand-primary/30 hover:bg-brand-primary/5 bg-slate-50/50 border-slate-100" : "text-slate-200 cursor-not-allowed border-transparent",
                    isCurrent && available && "border-brand-primary/50 text-brand-primary bg-brand-primary/10 shadow-sm"
                  )}
                >
                  {m}
                </button>
              );
            })}
          </div>
        )}

        {viewMode === 'years' && (
          <div className="grid grid-cols-3 gap-2 animate-in fade-in zoom-in-95 duration-200">
            {years.map(y => {
              const available = isYearAvailable(y);
              const isCurrent = viewDate.getFullYear() === y;
              return (
                <button
                  key={y}
                  disabled={!available}
                  onClick={() => {
                    setViewDate(new Date(y, viewDate.getMonth(), 1));
                    setViewMode('months');
                  }}
                  className={cn(
                    "py-6 text-sm font-bold rounded-xl border transition-all",
                    available ? "text-slate-700 hover:border-brand-primary hover:text-brand-primary bg-slate-50/30" : "text-slate-200 cursor-not-allowed border-transparent",
                    isCurrent && available && "border-brand-primary text-brand-primary bg-brand-primary/5"
                  )}
                >
                  {y}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Presets */}
      <div className="mt-6 pt-6 border-t border-slate-100 space-y-2">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Quick Select</p>
        <div className="flex flex-wrap gap-2">
          {presets.map(p => {
            const isActive = startDate === p.range?.[0] && endDate === p.range?.[1];
            return p.range && (
              <button
                key={p.label}
                onClick={() => onSelect(p.range![0], p.range![1])}
                className={cn(
                  "px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl border transition-all active:scale-95",
                  isActive 
                    ? "bg-brand-primary text-white border-brand-primary shadow-lg shadow-brand-primary/20" 
                    : "bg-slate-50 hover:bg-slate-100 text-slate-500 border-slate-100 hover:border-slate-200"
                )}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Status Footer */}
      <div className="mt-6 flex items-center gap-3 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/50">
        <div className="w-8 h-8 bg-brand-primary/10 rounded-lg flex items-center justify-center">
            <CalendarIcon size={14} className="text-brand-primary" />
        </div>
        <div>
            <p className="text-[10px] font-black text-indigo-900 leading-tight">
              {tempSelection ? 'Selecting Range...' : 'Current Selection'}
            </p>
            <p className="text-[11px] font-bold text-indigo-600">
                {tempSelection 
                  ? `${formatISO(tempSelection)} to ...` 
                  : (startDate && endDate ? `${startDate} to ${endDate}` : 'No range selected')}
            </p>
        </div>
      </div>
    </div>
  );
};
