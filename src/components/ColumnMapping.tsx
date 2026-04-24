import { useState } from 'react';
import { useDataStore } from '../store/useDataStore';
import { AlertCircle, Check, Loader2 } from 'lucide-react';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const REQUIRED_FIELDS = [
  { id: 'date', label: 'Date', description: 'Transaction or event date' },
  { id: 'revenue', label: 'Revenue/Sales', description: 'Total value generated' },
  { id: 'spend', label: 'Media Spend', description: 'Cost of advertisement' },
  { id: 'channel', label: 'Channel Name', description: 'Marketing source name' },
  { id: 'country', label: 'Country', description: 'Region or country code' },
];

export const ColumnMapping = () => {
  const { headers, mapping, setMapping, setActivePage, setIsProcessing } = useDataStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleMap = (field: string, header: string) => {
    setMapping({ ...mapping, [field]: header });
  };

  const handleContinue = async () => {
    setIsLoading(true);
    try {
      setMapping({ ...mapping });
      
      // Trigger Background Processing (Simulated)
      setIsProcessing(true);
      
      // Artificial delay for effect
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Navigate to full-page success transition
      setActivePage('success');
    } catch (error) {
      console.error("Failed to initialize dashboard:", error);
      setIsProcessing(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="overflow-hidden border border-slate-100 rounded-xl">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-6 py-4">System Field</th>
              <th className="px-6 py-4 text-center w-16">
                <span className="sr-only">Mapping</span>
              </th>
              <th className="px-6 py-4">Source Column</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {REQUIRED_FIELDS.map((field) => (
              <tr key={field.id} className="group hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      mapping[field.id] ? "bg-green-50 text-green-500" : "bg-slate-50 text-slate-400"
                    )}>
                      {mapping[field.id] ? <Check size={16} /> : <AlertCircle size={16} />}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        {field.label}
                        {!mapping[field.id] && (
                          <span className="text-[8px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-widest border border-amber-100">
                            Required
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{field.description}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5 text-center">
                   <div className="w-6 h-px bg-slate-200 inline-block align-middle relative after:content-[''] after:absolute after:right-0 after:top-1/2 after:-translate-y-1/2 after:border-y-4 after:border-y-transparent after:border-l-4 after:border-l-slate-200" />
                </td>
                <td className="px-6 py-5">
                  <select
                    value={mapping[field.id] || ''}
                    onChange={(e) => handleMap(field.id, e.target.value)}
                    className={cn(
                      "w-full bg-slate-50 border rounded-lg px-4 py-2.5 text-sm transition-all outline-none appearance-none cursor-pointer font-medium",
                      mapping[field.id] 
                        ? 'border-brand-primary/20 bg-white ring-2 ring-brand-primary/5 text-slate-900' 
                        : 'border-slate-200 text-slate-400 hover:border-slate-300'
                    )}
                  >
                    <option value="">Select source column...</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-6 pt-4">
        {!REQUIRED_FIELDS.every(f => !!mapping[f.id]) && (
          <div className="flex items-start gap-2 text-slate-400 bg-slate-50/50 p-4 rounded-xl border border-slate-100 flex-1">
            <AlertCircle size={18} className="mt-0.5 flex-shrink-0 text-amber-500" />
            <p className="text-xs leading-relaxed font-medium">
              Map all required system fields to your source CSV columns to enable full-cycle attribution and forecasting.
            </p>
          </div>
        )}

        <button
          onClick={handleContinue}
          disabled={!REQUIRED_FIELDS.every(f => !!mapping[f.id]) || isLoading}
          className={cn(
            "px-8 py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg min-w-[200px]",
            REQUIRED_FIELDS.every(f => !!mapping[f.id]) && !isLoading
              ? "bg-slate-900 text-white hover:bg-slate-800 shadow-slate-200 active:scale-95"
              : "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
          )}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-brand-primary" />
              Initializng...
            </>
          ) : (
            <>
              Initialize Dashboard
              {REQUIRED_FIELDS.every(f => !!mapping[f.id]) && <Check size={18} />}
            </>
          )}
        </button>
      </div>
    </div>
  );
};
