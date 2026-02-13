import { useCalibrateData } from '../hooks/useCalibrateData';
import { LiftStudyUpload } from '../components/LiftStudyUpload';
import { ActiveStudiesList } from '../components/ActiveStudiesList';
import { CalibrationImpactChart } from '../components/CalibrationImpactChart';
import { CoefficientChangesTable } from '../components/CoefficientChangesTable';
import { TuningParametersPanel } from '../components/TuningParametersPanel';
import { KPICard } from '../components/KPICard';
import { TrendingUp, Save, Play, X } from 'lucide-react';

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

  const handleFileUpload = (file: File) => {
    console.log('Uploaded lift study:', file.name);
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

        {/* Top Row: Upload + Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <LiftStudyUpload onFileUpload={handleFileUpload} />
          
          <KPICard
            label="MODEL FIT (R²)"
            value={metrics.modelFit.toFixed(2)}
            trend="+2.1%"
            trendDirection="up"
            icon={<TrendingUp size={20} />}
          />
          
          <KPICard
            label="MAPE"
            value={`${metrics.mape.toFixed(1)}%`}
            trend="+0.5%"
            trendDirection="up"
            icon={<TrendingUp size={20} />}
          />
        </div>

        {/* Second Row: Active Studies + ROI Delta */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ActiveStudiesList studies={activeStudies} onToggle={toggleStudy} />
          </div>
          
          <KPICard
            label="EST. ROI DELTA"
            value={`+${metrics.roiDelta}%`}
            trend="Projected"
            trendDirection="up"
            icon={<TrendingUp size={20} />}
          />
        </div>

        {/* Calibration Impact Chart */}
        <CalibrationImpactChart data={impactData} />

        {/* Bottom Row: Coefficient Changes + Tuning Parameters */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <CoefficientChangesTable changes={coefficientChanges} />
          </div>
          
          <TuningParametersPanel
            calibrationStrength={tuningParams.calibrationStrength}
            onCalibrationStrengthChange={tuningParams.setCalibrationStrength}
            priorWeight={tuningParams.priorWeight}
            onPriorWeightChange={tuningParams.setPriorWeight}
            onReset={handleReset}
          />
        </div>
    </div>
  );
};
