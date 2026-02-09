export interface SimulationParams {
  spendChange: number;
  seasonality: number;
  excludeOutliers: boolean;
}

interface SimulationPanelProps {
  params: SimulationParams;
  onChange: (params: SimulationParams) => void;
  onRecalculate: () => void;
}

export const SimulationPanel = ({ params, onChange, onRecalculate }: SimulationPanelProps) => {
  const handleSpendChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...params, spendChange: parseFloat(e.target.value) });
  };

  const handleSeasonalityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...params, seasonality: parseInt(e.target.value) });
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
      <h3 className="text-lg font-bold text-slate-900 mb-2">Forecast Parameters</h3>
      <p className="text-slate-500 text-sm mb-8">Adjust drivers to simulate scenarios.</p>

      {/* Spend Slider */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <label className="text-sm font-semibold text-slate-700">Paid Media Spend</label>
          <span className="text-brand-secondary font-bold">
            {params.spendChange > 0 ? '+' : ''}{(params.spendChange * 100).toFixed(0)}%
          </span>
        </div>
        <input 
          type="range" 
          min="-0.5" 
          max="0.5" 
          step="0.05"
          value={params.spendChange}
          onChange={handleSpendChange}
          className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-brand-primary"
        />
        <div className="flex justify-between text-xs text-slate-400 mt-2 font-medium">
          <span>-50%</span>
          <span>Current</span>
          <span>+50%</span>
        </div>
      </div>

      {/* Seasonality Slider */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <label className="text-sm font-semibold text-slate-700">Seasonality Weight</label>
          <span className="text-slate-900 font-medium">
            {params.seasonality === 0 ? 'Low' : params.seasonality === 1 ? 'Normal' : 'High'}
          </span>
        </div>
        <input 
          type="range" 
          min="0" 
          max="2" 
          step="1"
          value={params.seasonality}
          onChange={handleSeasonalityChange}
          className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-brand-secondary"
        />
        <div className="flex justify-between text-xs text-slate-400 mt-2 font-medium">
          <span>Low</span>
          <span>Normal</span>
          <span>High</span>
        </div>
      </div>

       {/* Toggle */}
       <div className="flex items-center justify-between mb-8">
         <div>
            <label className="text-sm font-semibold text-slate-700 block">Exclude Outliers</label>
            <span className="text-xs text-slate-400">Remove anomaly events</span>
         </div>
         <button 
           onClick={() => onChange({ ...params, excludeOutliers: !params.excludeOutliers })}
           className={`w-11 h-6 rounded-full transition-colors relative ${params.excludeOutliers ? 'bg-brand-primary' : 'bg-slate-200'}`}
         >
            <div className={`w-5 h-5 bg-white rounded-full shadow-sm absolute top-0.5 transition-transform ${params.excludeOutliers ? 'translate-x-5.5 left-0.5' : 'left-0.5'}`} />
         </button>
       </div>

       {/* CTA */}
       <button 
         onClick={onRecalculate}
         className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200"
       >
         Recalculate Scenario
       </button>
    </div>
  );
};
