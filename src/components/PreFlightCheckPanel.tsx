import { CheckCircle2, Lightbulb, Play } from 'lucide-react';

interface PreFlightCheckPanelProps {
  totalVariables: number;
  missingValues: number;
  estimatedRuntime: number;
  isReady: boolean;
  onStartTraining: () => void;
}

export const PreFlightCheckPanel = ({
  totalVariables,
  missingValues,
  estimatedRuntime,
  isReady,
  onStartTraining
}: PreFlightCheckPanelProps) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 sticky top-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
          <CheckCircle2 size={20} className="text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">Pre-flight Check</h3>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-xs font-bold text-green-600 uppercase tracking-wider">Ready</span>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="space-y-3">
        <div className="flex justify-between items-center py-2 border-b border-slate-100">
          <span className="text-sm font-medium text-slate-600">Total Variables</span>
          <span className="text-sm font-bold text-slate-900">{totalVariables} Selected</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-slate-100">
          <span className="text-sm font-medium text-slate-600">Missing Values</span>
          <span className="text-sm font-bold text-slate-900">{missingValues}</span>
        </div>
        <div className="flex justify-between items-center py-2">
          <span className="text-sm font-medium text-slate-600">Est. Runtime</span>
          <span className="text-sm font-bold text-brand-third">~{estimatedRuntime} mins</span>
        </div>
      </div>

      {/* Start Training Button */}
      <button
        onClick={onStartTraining}
        disabled={!isReady}
        className="w-full bg-brand-secondary hover:bg-brand-secondary/90 disabled:bg-slate-200 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-red-100 disabled:shadow-none flex items-center justify-center gap-2"
      >
        <Play size={18} fill="currentColor" />
        Start Training
      </button>

      {/* Last Run Status */}
      <div className="space-y-3 pt-4 border-t border-slate-100">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Last Run Status</span>
          <span className="text-xs text-slate-400">Today 10:22 AM</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <div className="bg-green-500 h-full rounded-full" style={{ width: '100%' }}></div>
        </div>
        <div className="space-y-1 text-xs text-slate-500">
          <p className="flex items-center gap-2">
            <span className="text-green-600">✓</span> Data loaded successfully
          </p>
          <p className="flex items-center gap-2">
            <span className="text-green-600">✓</span> Initializing MCMC chains...
          </p>
          <p className="flex items-center gap-2">
            <span className="text-green-600">✓</span> Sampling 4 chains, 1000 draws
          </p>
          <p className="flex items-center gap-2">
            <span className="text-green-600">✓</span> Convergence checks passed.
          </p>
          <p className="flex items-center gap-2">
            <span className="text-green-600">✓</span> Model saved as v1.0.0
          </p>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Lightbulb size={16} className="text-blue-600" />
          <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">Tip for better results</span>
        </div>
        <p className="text-xs text-blue-700 leading-relaxed">
          Including Competitor Pricing typically improves model accuracy by 15% for retail clients. Ensure your data source is up to date.
        </p>
      </div>
    </div>
  );
};
