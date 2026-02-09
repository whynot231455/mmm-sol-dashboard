import { RotateCcw } from 'lucide-react';

interface TuningParametersPanelProps {
  calibrationStrength: number;
  onCalibrationStrengthChange: (value: number) => void;
  priorWeight: number;
  onPriorWeightChange: (value: number) => void;
  onReset: () => void;
}

export const TuningParametersPanel = ({
  calibrationStrength,
  onCalibrationStrengthChange,
  priorWeight,
  onPriorWeightChange,
  onReset
}: TuningParametersPanelProps) => {
  const getPriorWeightLabel = (value: number) => {
    if (value < 33) return 'Conservative';
    if (value < 67) return 'Medium';
    return 'Aggressive';
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-slate-900">Tuning Parameters</h3>
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-brand-primary hover:bg-brand-primary/5 rounded-lg transition-colors"
        >
          <RotateCcw size={14} />
          Reset to Defaults
        </button>
      </div>

      <div className="space-y-6">
        {/* Calibration Strength */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm font-semibold text-slate-700">Calibration Strength</label>
            <span className="text-sm font-bold text-brand-secondary bg-red-50 px-3 py-1 rounded-lg">
              {calibrationStrength}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={calibrationStrength}
            onChange={(e) => onCalibrationStrengthChange(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-brand-secondary"
          />
          <div className="flex justify-between text-xs font-medium text-slate-400">
            <span>Conservative</span>
            <span>Aggressive</span>
          </div>
        </div>

        {/* Prior Weight (Bayesian) */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold text-slate-700">Prior Weight (Bayesian)</label>
              <div className="group relative">
                <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-xs text-slate-600 cursor-help">
                  ?
                </div>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-slate-900 text-white text-xs rounded-lg">
                  Controls how much weight to give to prior beliefs vs. observed data
                </div>
              </div>
            </div>
            <span className="text-sm font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-lg">
              {getPriorWeightLabel(priorWeight)}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={priorWeight}
            onChange={(e) => onPriorWeightChange(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-brand-third"
          />
          <div className="flex justify-between text-xs font-medium text-slate-400">
            <span>Low</span>
            <span>High</span>
          </div>
        </div>
      </div>
    </div>
  );
};
