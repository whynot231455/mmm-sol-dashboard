import { Sliders } from 'lucide-react';

interface HyperparameterSlidersProps {
  adstockDecayMax: number;
  saturationHillMax: number;
  onAdstockChange: (value: number) => void;
  onSaturationChange: (value: number) => void;
}

export const HyperparameterSliders = ({
  adstockDecayMax,
  saturationHillMax,
  onAdstockChange,
  onSaturationChange
}: HyperparameterSlidersProps) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
          <Sliders size={20} className="text-brand-primary" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">Hyperparameters</h3>
        </div>
      </div>

      <div className="space-y-6">
        {/* Adstock Decay Max */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm font-semibold text-slate-700">Adstock Decay Max</label>
            <span className="text-sm font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-lg">
              {adstockDecayMax.toFixed(1)}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={adstockDecayMax}
            onChange={(e) => onAdstockChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-brand-third"
          />
          <div className="flex justify-between text-xs font-medium text-slate-400">
            <span>0.0</span>
            <span>1.0</span>
          </div>
        </div>

        {/* Saturation Hill Max */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm font-semibold text-slate-700">Saturation Hill Max</label>
            <span className="text-sm font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-lg">
              {saturationHillMax.toFixed(1)}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="5"
            step="0.1"
            value={saturationHillMax}
            onChange={(e) => onSaturationChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-brand-third"
          />
          <div className="flex justify-between text-xs font-medium text-slate-400">
            <span>0.0</span>
            <span>5.0</span>
          </div>
        </div>
      </div>
    </div>
  );
};
