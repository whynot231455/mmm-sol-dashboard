import { useDataStore } from '../store/useDataStore';
import { AlertCircle, Check } from 'lucide-react';

const REQUIRED_FIELDS = [
  { id: 'date', label: 'Date', description: 'Transaction or event date' },
  { id: 'revenue', label: 'Revenue/Sales', description: 'Total value generated' },
  { id: 'spend', label: 'Media Spend', description: 'Cost of advertisement' },
  { id: 'channel', label: 'Channel Name', description: 'Marketing source name' },
  { id: 'country', label: 'Country', description: 'Region or country code' },
];

export const ColumnMapping = () => {
  const { headers, mapping, setMapping } = useDataStore();

  const handleMap = (field: string, header: string) => {
    setMapping({ ...mapping, [field]: header });
  };

  return (
    <div className="space-y-6">
      {REQUIRED_FIELDS.map((field) => (
        <div key={field.id} className="group">
          <div className="flex items-center justify-between mb-2">
            <div>
              <label className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                {field.label}
                {mapping[field.id] && <Check className="w-4 h-4 text-green-500" />}
              </label>
              <p className="text-xs text-slate-500">{field.description}</p>
            </div>
            {(!mapping[field.id]) && (
              <span className="text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-amber-100">
                Required
              </span>
            )}
          </div>
          
          <select
            value={mapping[field.id] || ''}
            onChange={(e) => handleMap(field.id, e.target.value)}
            className={`
              w-full bg-slate-50 border rounded-lg px-4 py-2.5 text-sm transition-all outline-none appearance-none cursor-pointer
              ${mapping[field.id] 
                ? 'border-indigo-100 bg-white ring-2 ring-indigo-500/5' 
                : 'border-slate-200 hover:border-slate-300'}
            `}
          >
            <option value="">Select a column...</option>
            {headers.map((h) => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
        </div>
      ))}

      <button
        disabled={!REQUIRED_FIELDS.every(f => !!mapping[f.id])}
        className="w-full mt-4 bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-slate-200 flex items-center justify-center gap-2"
      >
        Continue to Dashboard
      </button>

      {!REQUIRED_FIELDS.every(f => !!mapping[f.id]) && (
        <div className="flex items-start gap-2 text-slate-400 bg-slate-50 p-3 rounded-lg border border-slate-100">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <p className="text-xs leading-relaxed">Map all required fields correctly to unlock the analytics dashboard.</p>
        </div>
      )}
    </div>
  );
};
