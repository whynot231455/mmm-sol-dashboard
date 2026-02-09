import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FeatureSelectionPanelProps {
  title: string;
  icon: React.ReactNode;
  options: string[];
  selected: string[];
  onToggle: (option: string) => void;
  defaultExpanded?: boolean;
}

export const FeatureSelectionPanel = ({
  title,
  icon,
  options,
  selected,
  onToggle,
  defaultExpanded = false
}: FeatureSelectionPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-6 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
            {icon}
          </div>
          <div className="text-left">
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500">
              Select variables to include in the model training
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-brand-secondary bg-red-50 px-3 py-1 rounded-full">
            {selected.length} Selected
          </span>
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </button>

      {isExpanded && (
        <div className="px-6 pb-6 pt-2 border-t border-slate-100 grid grid-cols-2 gap-3">
          {options.map((option) => (
            <label
              key={option}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group"
            >
              <input
                type="checkbox"
                checked={selected.includes(option)}
                onChange={() => onToggle(option)}
                className="w-5 h-5 rounded border-2 border-slate-300 text-brand-primary focus:ring-2 focus:ring-brand-primary/20 cursor-pointer"
              />
              <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">
                {option}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};
