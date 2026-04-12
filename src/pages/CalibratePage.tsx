import { useCalibrateData } from '../hooks/useCalibrateData';
import { LiftStudyUpload } from '../components/LiftStudyUpload';
import { ActiveStudiesList } from '../components/ActiveStudiesList';
import { CalibrationImpactChart } from '../components/CalibrationImpactChart';
import { CoefficientChangesTable } from '../components/CoefficientChangesTable';
import { TuningParametersPanel } from '../components/TuningParametersPanel';
import { KPICard } from '../components/KPICard';
import { TrendingUp, Save, Play, X, Activity, BarChart3, DollarSign } from 'lucide-react';

export const CalibratePage = () => {
  const data = useCalibrateData();

  if (!data) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-900 mb-2">No Data Available</h2>
          <p className="text-slate-500">Please upload CSV data first to calibrate the model.</p>
        </div>
      </div>
    );
  }

  const { metrics, impactData, coefficientChanges, activeStudies, toggleStudy, tuningParams } = data;

  const handleFileUpload = () => {
    // In real implementation, parse and process the file
  };

  const handleReset = () => {
    tuningParams.setCalibrationStrength(85);
    tuningParams.setPriorWeight(50);
  };

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Model Calibration</h1>
            <p className="text-slate-500 mt-2 max-w-2xl">
              Tune your model with real-world experiment data to improve predictive accuracy.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
              <X size={18} />
              Discard
            </button>
            <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
              <Save size={18} />
              Save Calibration
            </button>
            <button className="flex items-center gap-2 px-6 py-3 bg-brand-secondary hover:bg-brand-secondary/90 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-red-100">
              <Play size={18} fill="currentColor" />
              Run Simulation
            </button>
          </div>
        </div>

        {/* Primary Calibration Results */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <KPICard
            label="BASELINE SALES"
            value={`$${(metrics.baselineSales / 1000).toFixed(1)}k`}
            trend="Org. Gravity"
            trendDirection="up"
            icon={<Activity size={20} />}
          />
          <KPICard
            label="TOTAL MEDIA IMPACT"
            value={`$${(metrics.totalMediaImpact / 1000).toFixed(1)}k`}
            trend="+12.4%"
            trendDirection="up"
            icon={<TrendingUp size={20} />}
          />
          <KPICard
            label="EST. ROI DELTA"
            value={`+${metrics.roiDelta}%`}
            trend="Projected"
            trendDirection="up"
            icon={<BarChart3 size={20} />}
          />
        </div>

        {/* Attribution across channels */}
        <div className="grid grid-cols-1 gap-6">
           <CalibrationImpactChart data={impactData} />
        </div>

        {/* Configuration Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ActiveStudiesList studies={activeStudies} onToggle={toggleStudy} />
          </div>
          <LiftStudyUpload onFileUpload={handleFileUpload} />
        </div>

        {/* Technical Details & Tuning */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <CoefficientChangesTable changes={coefficientChanges} />
          </div>
          <div className="space-y-6">
            <TuningParametersPanel
              calibrationStrength={tuningParams.calibrationStrength}
              onCalibrationStrengthChange={tuningParams.setCalibrationStrength}
              priorWeight={tuningParams.priorWeight}
              onPriorWeightChange={tuningParams.setPriorWeight}
              onReset={handleReset}
            />
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <p className="text-slate-500 text-xs font-medium mb-1 uppercase tracking-wider">Model Fit</p>
                <p className="text-xl font-bold text-slate-900">{metrics.modelFit.toFixed(3)}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <p className="text-slate-500 text-xs font-medium mb-1 uppercase tracking-wider">MAPE</p>
                <p className="text-xl font-bold text-slate-900">{metrics.mape.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
};
