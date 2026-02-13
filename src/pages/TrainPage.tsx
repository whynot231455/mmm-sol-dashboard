import { useTrainConfig } from '../hooks/useTrainConfig';
import { TrainingWindowSelector } from '../components/TrainingWindowSelector';
import { FeatureSelectionPanel } from '../components/FeatureSelectionPanel';
import { HyperparameterSliders } from '../components/HyperparameterSliders';
import { PreFlightCheckPanel } from '../components/PreFlightCheckPanel';
import { Tv, TrendingUp, BarChart3, Save } from 'lucide-react';

export const TrainPage = () => {
  const {
    config,
    setConfig,
    availableChannels,
    organicBaselineOptions,
    externalFactorOptions,
    metrics
  } = useTrainConfig();

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
    console.log('Starting training with config:', config);
    alert('Training started! (This is a demo)');
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
              onStartDateChange={(date) => setConfig(prev => ({
                ...prev,
                trainingWindow: { ...prev.trainingWindow, startDate: date }
              }))}
              onEndDateChange={(date) => setConfig(prev => ({
                ...prev,
                trainingWindow: { ...prev.trainingWindow, endDate: date }
              }))}
            />

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
          </div>

          {/* Right Column - Pre-flight Check */}
          <div className="lg:col-span-1">
            <PreFlightCheckPanel
              totalVariables={metrics.totalVariables}
              missingValues={metrics.missingValues}
              estimatedRuntime={metrics.estimatedRuntime}
              isReady={metrics.isReady}
              onStartTraining={handleStartTraining}
            />
          </div>
        </div>
    </div>
  );
};
