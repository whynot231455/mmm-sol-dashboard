import { useTrainConfig } from '../hooks/useTrainConfig';
import { useDataStore } from '../store/useDataStore';
import { TrainingWindowSelector } from '../components/TrainingWindowSelector';
import { FeatureSelectionPanel } from '../components/FeatureSelectionPanel';
import { HyperparameterSliders } from '../components/HyperparameterSliders';
import { PreFlightCheckPanel } from '../components/PreFlightCheckPanel';
import { Tv, TrendingUp, BarChart3, Save, Target, Percent, Cpu, Activity, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

export const TrainPage = () => {
  const {
    config,
    setConfig,
    headers,
    dateConstraints,
    availableChannels,
    organicBaselineOptions,
    externalFactorOptions,
    metrics
  } = useTrainConfig();

  const { isProcessing, setIsProcessing } = useDataStore();
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [showMetrics, setShowMetrics] = useState(false);

  const handleToggleFeature = (category: 'mediaChannels' | 'organicBaseline' | 'externalFactors', option: string) => {
    setConfig(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [category]: prev.features[category].includes(option)
          ? prev.features[category].filter(item => item !== option)
          : [...prev.features[category], option]
      }
    }));
  };

  const handleStartTraining = () => {
    setIsProcessing(true);
    setTrainingProgress(0);
    setShowMetrics(false);
    
    const interval = setInterval(() => {
      setTrainingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsProcessing(false);
          setShowMetrics(true);
          return 100;
        }
        return prev + 2;
      });
    }, 50);
  };

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Model Training Configuration</h1>
            <p className="text-slate-500 mt-2 max-w-2xl">
              Configure feature selection, hyperparameters, and validation settings for the next Marketing Mix Model run.
            </p>
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
            <Save size={18} />
            Save Draft
          </button>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Configuration */}
          <div className="lg:col-span-2 space-y-6">
            {/* Training Window */}
            <TrainingWindowSelector
              startDate={config.trainingWindow.startDate}
              endDate={config.trainingWindow.endDate}
              minDate={dateConstraints.min}
              maxDate={dateConstraints.max}
              onStartDateChange={(date) => setConfig(prev => ({
                ...prev,
                trainingWindow: { ...prev.trainingWindow, startDate: date }
              }))}
              onEndDateChange={(date) => setConfig(prev => ({
                ...prev,
                trainingWindow: { ...prev.trainingWindow, endDate: date }
              }))}
            />

            {/* Target Variable */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-primary/10 rounded-xl flex items-center justify-center">
                  <Target size={20} className="text-brand-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Target Variable</h3>
                  <p className="text-xs text-slate-500">Select the KPI you want to model and predict.</p>
                </div>
              </div>
              <select 
                value={config.targetVariable}
                onChange={(e) => setConfig(prev => ({ ...prev, targetVariable: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all appearance-none cursor-pointer"
              >
                <option value="">Select Target Variable</option>
                {headers.map((header: string) => (
                  <option key={header} value={header}>{header}</option>
                ))}
              </select>
            </div>

            {/* Model Selection & Training Settings */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Cpu size={18} className="text-brand-primary" />
                    <span className="text-sm font-bold text-slate-900">Model Choice</span>
                  </div>
                  <select 
                    value={config.modelType}
                    onChange={(e) => setConfig(prev => ({ ...prev, modelType: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all"
                  >
                    <option value="Bayesian Modeling">Bayesian Modeling</option>
                    <option value="OLS Regression">OLS Regression</option>
                    <option value="Ridge Regression">Ridge Regression</option>
                  </select>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Percent size={18} className="text-brand-primary" />
                    <span className="text-sm font-bold text-slate-900">Train/Test Ratio</span>
                  </div>
                  <select 
                    value={config.trainTestRatio}
                    onChange={(e) => setConfig(prev => ({ ...prev, trainTestRatio: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all"
                  >
                    <option value="90/10">90/10</option>
                    <option value="80/20">80/20</option>
                    <option value="70/30">70/30</option>
                    <option value="60/40">60/40</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Feature Selection */}
            <FeatureSelectionPanel
              title="Media Channels"
              icon={<Tv size={20} className="text-brand-primary" />}
              options={availableChannels}
              selected={config.features.mediaChannels}
              onToggle={(option) => handleToggleFeature('mediaChannels', option)}
              defaultExpanded={true}
            />

            <FeatureSelectionPanel
              title="Organic Baseline"
              icon={<TrendingUp size={20} className="text-brand-primary" />}
              options={organicBaselineOptions}
              selected={config.features.organicBaseline}
              onToggle={(option) => handleToggleFeature('organicBaseline', option)}
            />

            <FeatureSelectionPanel
              title="External Factors"
              icon={<BarChart3 size={20} className="text-brand-primary" />}
              options={externalFactorOptions}
              selected={config.features.externalFactors}
              onToggle={(option) => handleToggleFeature('externalFactors', option)}
            />

            {/* Hyperparameters */}
            <HyperparameterSliders
              adstockDecayMax={config.hyperparameters.adstockDecayMax}
              saturationHillMax={config.hyperparameters.saturationHillMax}
              onAdstockChange={(value) => setConfig(prev => ({
                ...prev,
                hyperparameters: { ...prev.hyperparameters, adstockDecayMax: value }
              }))}
              onSaturationChange={(value) => setConfig(prev => ({
                ...prev,
                hyperparameters: { ...prev.hyperparameters, saturationHillMax: value }
              }))}
            />

            {/* Training Status Overlay/Section */}
            {isProcessing && (
              <div className="bg-slate-900 rounded-2xl p-8 text-white space-y-6 animate-in fade-in zoom-in duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-brand-primary/20 rounded-xl flex items-center justify-center animate-pulse">
                      <Activity size={24} className="text-brand-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Model training in progress...</h3>
                      <p className="text-slate-400 text-sm">Initializing MCMC Sampling & Convergence Checks</p>
                    </div>
                  </div>
                  <span className="text-2xl font-black text-brand-primary">{trainingProgress}%</span>
                </div>
                
                <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-brand-primary h-full rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${trainingProgress}%` }}
                  ></div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Iterating</p>
                    <p className="text-lg font-bold">1,240 / 4,000</p>
                  </div>
                  <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Est. Error</p>
                    <p className="text-lg font-bold">0.024</p>
                  </div>
                  <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Chains</p>
                    <p className="text-lg font-bold">4 Active</p>
                  </div>
                </div>
              </div>
            )}

            {/* Metrics Display */}
            {showMetrics && (
              <div className="bg-white border-2 border-green-500 rounded-2xl p-8 space-y-8 animate-in slide-in-from-top-4 duration-500">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <CheckCircle2 size={24} className="text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">Model Training Complete</h3>
                      <p className="text-slate-500 text-sm font-medium">Results validated and ready for analysis.</p>
                    </div>
                  </div>
                  <button className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-green-100">
                    View Full Report
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Model Accuracy (R²)</p>
                    <p className="text-3xl font-black text-slate-900">0.942</p>
                    <p className="text-[10px] font-bold text-green-600 mt-1">Excellent Fit</p>
                  </div>
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">MAPE</p>
                    <p className="text-3xl font-black text-slate-900">4.8%</p>
                    <p className="text-[10px] font-bold text-green-600 mt-1">Below Threshold</p>
                  </div>
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">DW Statistic</p>
                    <p className="text-3xl font-black text-slate-900">2.04</p>
                    <p className="text-[10px] font-bold text-green-600 mt-1">No Autocorrelation</p>
                  </div>
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Convergence</p>
                    <p className="text-3xl font-black text-slate-900">Passed</p>
                    <p className="text-[10px] font-bold text-green-600 mt-1">R-Hat &lt; 1.05</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Pre-flight Check */}
          <div className="lg:col-span-1">
            <PreFlightCheckPanel
              totalVariables={metrics.totalVariables}
              missingValues={metrics.missingValues}
              estimatedRuntime={metrics.estimatedRuntime}
              isReady={metrics.isReady}
              isProcessing={isProcessing}
              onStartTraining={handleStartTraining}
            />
          </div>
        </div>
    </div>
  );
};
