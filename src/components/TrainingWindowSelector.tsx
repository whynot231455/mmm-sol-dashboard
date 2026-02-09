import { Calendar } from 'lucide-react';

interface TrainingWindowSelectorProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
}

export const TrainingWindowSelector = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange
}: TrainingWindowSelectorProps) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
          <Calendar size={20} className="text-brand-primary" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">Training Window</h3>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
          />
        </div>
      </div>

      {startDate && endDate && (
        <div className="flex items-start gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
          <span className="text-brand-primary">●</span>
          <p>All rows of data included in this window</p>
        </div>
      )}
    </div>
  );
};
