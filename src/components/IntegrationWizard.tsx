import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCcw,
  Lock,
  Info,
  Sparkles,
  Shield,
  ArrowUpRight,
  Clock3,
  Globe,
} from 'lucide-react';
import {
  integrationApi,
  type IntegrationStep,
  type IntegrationValidationResult,
} from '../services/integrationApi';
import { useDataStore } from '../store/useDataStore';
import type { IntegrationStatus } from './IntegrationCard';

interface Props {
  platform: {
    id: string;
    name: string;
    icon: React.ReactNode;
  };
  onClose: () => void;
  onSuccess: () => void;
}

const getIntegrationStatus = (result: IntegrationValidationResult): IntegrationStatus => {
  if (result.result === 'approval_required') {
    return 'pending_approval';
  }

  if (result.result === 'connected') {
    return result.details?.syncStatus === 'syncing' ? 'syncing' : 'connected';
  }

  return 'error';
};

export const IntegrationWizard: React.FC<Props> = ({ platform, onClose, onSuccess }) => {
  const [step, setStep] = useState(0);
  const [steps, setSteps] = useState<IntegrationStep[]>([]);
  const [config, setConfig] = useState<Record<string, string>>(() => integrationApi.getInitialConfig());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sampleData, setSampleData] = useState<Record<string, unknown> | null>(null);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [showGuide, setShowGuide] = useState(false);
  const [result, setResult] = useState<IntegrationValidationResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { addIntegration, integrations } = useDataStore();

  const currentStep = steps[step];
  const isLastStep = step === steps.length - 1;

  const canProceed = useCallback(() => {
    if (!currentStep) return false;
    if (currentStep.type === 'info') return true;
    if (currentStep.type === 'oauth') return platform.id === 'meta_ads' ? true : Boolean(config.oauth_success);

    if (currentStep.type === 'input') {
      const value = config[currentStep.inputKey || '']?.trim();
      return Boolean(value);
    }

    return false;
  }, [config, currentStep, platform.id]);

  const handleConnect = useCallback(async () => {
    const validationError = integrationApi.validateConfig(platform.id, config);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const validationResult = await integrationApi.testConnection(platform.id, config);
      setResult(validationResult);

      if (validationResult.result === 'error' || validationResult.result === 'invalid_account' || validationResult.result === 'unsupported') {
        setError(validationResult.message);
        return;
      }

      const nextStatus = getIntegrationStatus(validationResult);
      const shouldFetchSampleData = validationResult.result === 'connected';
      const liveSample = shouldFetchSampleData ? await integrationApi.fetchSampleData(platform.id, config) : null;

      if (liveSample) {
        setSampleData(liveSample);
      }

      await addIntegration({
        platform_id: platform.id,
        status: nextStatus,
        account_name: validationResult.accountName || platform.name,
        account_id: validationResult.externalAccountId || config.accountId || config.storeUrl || 'Unknown',
        config: {
          ...config,
          last_result: validationResult.result,
          last_message: validationResult.message,
          details: validationResult.details || {},
          ...(liveSample ? { sample_data: liveSample } : {}),
        },
        last_synced_at: validationResult.result === 'connected' ? new Date().toISOString() : null,
      });

      setStep(steps.length);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to connect. Please check the integration settings and try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [platform.id, platform.name, config, addIntegration, steps.length]);

  const handleMetaOAuth = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { authorizationUrl } = await integrationApi.startMetaOAuth();
      try {
        window.location.assign(authorizationUrl);
      } catch {
        window.location.href = authorizationUrl;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start Meta OAuth.';
      setError(message);
      setLoading(false);
    }
  }, []);

  const handleNext = useCallback(async () => {
    setError(null);
    if (isLastStep) {
      await handleConnect();
      return;
    }

    setDirection('forward');
    setStep((current) => current + 1);
  }, [handleConnect, isLastStep]);

  const handleBack = () => {
    setDirection('backward');
    setStep((current) => current - 1);
  };

  useEffect(() => {
    setSteps(integrationApi.getSteps(platform.id));
    setConfig(integrationApi.getInitialConfig());
    setError(null);
    setSampleData(null);
    setResult(null);
    setStep(0);
    setShowGuide(false);
  }, [platform.id]);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !loading) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [loading, onClose]);

  useEffect(() => {
    if (steps[step]?.type === 'input') {
      window.setTimeout(() => inputRef.current?.focus(), 350);
    }
  }, [step, steps]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && canProceed()) {
      void handleNext();
    }
  };

  const progress = steps.length > 0 ? (step / steps.length) * 100 : 0;
  const isSuccess = step >= steps.length && steps.length > 0;
  const isPendingApproval = result?.result === 'approval_required';
  const isConnected = result?.result === 'connected';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget && !loading) {
          onClose();
        }
      }}
    >
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-lg animate-in fade-in duration-300" />

      <div className="relative bg-white w-full max-w-2xl rounded-[32px] overflow-hidden shadow-2xl shadow-slate-900/20 flex flex-col max-h-[90vh] animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
        <div className="h-1 bg-slate-100 w-full">
          <div
            className="h-full bg-gradient-to-r from-brand-primary to-brand-secondary rounded-r-full transition-all duration-700 ease-out"
            style={{ width: isSuccess ? '100%' : `${progress}%` }}
          />
        </div>

        <div className="px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/60 flex items-center justify-center shadow-sm">
              {platform.icon}
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 leading-tight">Connect {platform.name}</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mt-0.5">
                {isSuccess ? 'Complete' : `Step ${step + 1} of ${steps.length}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2.5 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all disabled:opacity-30"
          >
            <X size={20} />
          </button>
        </div>

        {!isSuccess && steps.length > 1 && (
          <div className="px-8 pb-2 flex items-center gap-2">
            {steps.map((item, index) => (
              <button key={item.id} disabled className="flex items-center gap-2 flex-1">
                <div
                  className={`
                    h-1.5 rounded-full flex-1 transition-all duration-500
                    ${index < step ? 'bg-brand-primary' : index === step ? 'bg-brand-primary/40' : 'bg-slate-100'}
                  `}
                />
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-10 py-8">
          {!isSuccess ? (
            <div
              key={`step-${step}`}
              className={`space-y-7 ${direction === 'forward' ? 'animate-in slide-in-from-right-6' : 'animate-in slide-in-from-left-6'} fade-in duration-400`}
            >
              <div className="space-y-2.5">
                <div className="flex items-center gap-2.5">
                  {currentStep?.type === 'info' && (
                    <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                      <Info size={14} className="text-blue-500" />
                    </div>
                  )}
                  {currentStep?.type === 'input' && (
                    <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
                      <Sparkles size={14} className="text-violet-500" />
                    </div>
                  )}
                  <h3 className="text-2xl font-black text-slate-900 leading-tight">{currentStep?.title}</h3>
                </div>
                <p className="text-slate-500 font-medium leading-relaxed text-[15px]">{currentStep?.description}</p>
              </div>

              {currentStep?.type === 'info' && (
                <div className="p-5 bg-gradient-to-br from-blue-50/80 to-slate-50/80 rounded-2xl border border-blue-100/50 space-y-3">
                  <p className="text-[11px] font-black text-blue-400 uppercase tracking-widest">Before you begin</p>
                  <ul className="space-y-2.5">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 size={16} className="text-green-500 mt-0.5 shrink-0" />
                      <span className="text-sm font-medium text-slate-600">Active account with admin permissions</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 size={16} className="text-green-500 mt-0.5 shrink-0" />
                      <span className="text-sm font-medium text-slate-600">Your team is ready to approve our access request</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 size={16} className="text-green-500 mt-0.5 shrink-0" />
                      <span className="text-sm font-medium text-slate-600">Account ID or customer ID available</span>
                    </li>
                  </ul>
                </div>
              )}

              {currentStep?.type === 'input' && (
                <div className="space-y-3" onKeyDown={handleKeyDown}>
                  <label
                    htmlFor={`integration-input-${currentStep.inputKey}`}
                    className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"
                  >
                    {currentStep.inputLabel}
                    <span className="text-red-400 text-xs">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id={`integration-input-${currentStep.inputKey}`}
                      ref={inputRef}
                      type="text"
                      placeholder={currentStep.inputPlaceholder}
                      value={config[currentStep.inputKey || ''] || ''}
                      onChange={(event) => setConfig({ ...config, [currentStep.inputKey || '']: event.target.value })}
                      className={`
                        w-full px-6 py-4 bg-slate-50/80 border rounded-2xl text-slate-900
                        placeholder:text-slate-300 focus:outline-none focus:ring-2 transition-all font-bold text-[15px]
                        ${config[currentStep.inputKey || '']?.trim()
                          ? 'border-green-200 focus:ring-green-100 bg-green-50/30'
                          : 'border-slate-100 focus:ring-brand-primary/10'}
                      `}
                    />
                    {config[currentStep.inputKey || '']?.trim() && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 animate-in zoom-in duration-200">
                        <CheckCircle2 size={20} className="text-green-500" />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-4 mt-4">
                    {currentStep.helpUrl && (
                      <button
                        onClick={() => window.open(currentStep.helpUrl, '_blank', 'noopener,noreferrer')}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 transition-all shadow-sm group w-fit"
                      >
                        <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        Find your {currentStep.inputLabel}
                      </button>
                    )}

                    <div className="flex items-start gap-3 p-4 bg-amber-50/50 rounded-2xl border border-amber-100/50">
                      <Shield size={16} className="text-amber-600 shrink-0 mt-0.5" />
                      <div className="space-y-3">
                        <p className="text-[11px] font-bold text-amber-800 leading-relaxed">
                          Your client only needs to enter the account ID here. We handle the backend verification after access is approved in {platform.name}.
                        </p>

                        {currentStep.howToSteps && (
                          <button
                            onClick={() => setShowGuide(!showGuide)}
                            className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-amber-600 hover:text-amber-700 transition-colors"
                          >
                            {showGuide ? 'Hide Instructions' : 'How do I approve access?'}
                            <ChevronRight size={12} className={`transition-transform duration-300 ${showGuide ? 'rotate-90' : ''}`} />
                          </button>
                        )}
                      </div>
                    </div>

                    {showGuide && currentStep.howToSteps && (
                      <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-4 animate-in slide-in-from-top-2 duration-300">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Approval Checklist</h4>
                        <div className="space-y-3">
                          {currentStep.howToSteps.map((item, index) => (
                            <div key={index} className="flex items-start gap-3 group">
                              <div className="w-5 h-5 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-brand-primary/5 group-hover:border-brand-primary/20 transition-colors">
                                <span className="text-[10px] font-bold text-slate-400 group-hover:text-brand-primary transition-colors">{index + 1}</span>
                              </div>
                              <p className="text-xs font-medium text-slate-600 leading-relaxed">{item}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {currentStep?.type === 'oauth' && (
                <div className="space-y-4 text-center py-6">
                  <div className="w-16 h-16 bg-[#1877F2]/10 text-[#1877F2] rounded-full flex items-center justify-center mx-auto mb-4">
                    <Globe size={32} />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900">Authorize with Meta</h4>
                  <p className="text-sm text-slate-500 max-w-sm mx-auto">
                    Click the button below to log in with your Facebook account. After you return, you’ll choose the specific ad account to connect.
                  </p>
                  <button
                    onClick={() => void handleMetaOAuth()}
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#1877F2] hover:bg-[#1877F2]/90 text-white rounded-xl font-bold transition-colors disabled:opacity-50"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Globe size={18} />}
                    Log in with Facebook
                  </button>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-3 p-4 bg-red-50 rounded-2xl text-red-600 border border-red-100 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold">{error}</p>
                    {!!result?.details?.rawResponse && (
                      <div className="mt-2 p-2 bg-black/5 rounded text-[10px] font-mono break-all max-h-32 overflow-y-auto">
                        {String(result.details.rawResponse)}
                      </div>
                    )}
                    <p className="text-xs font-medium text-red-400 mt-1">The client should not move forward until this step succeeds cleanly.</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 px-4 py-3 bg-slate-50/80 rounded-2xl border border-slate-100/80">
                <Lock size={14} className="text-slate-400 shrink-0" />
                <p className="text-[10px] font-bold text-slate-400 leading-normal">
                  256-bit encrypted · Clients only provide account IDs in this flow
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-8 py-6 animate-in zoom-in-95 fade-in duration-500">
              <div className="relative inline-block">
                <div className={`absolute inset-0 rounded-full blur-3xl opacity-30 animate-pulse scale-150 ${isPendingApproval ? 'bg-amber-200' : 'bg-green-200'}`} />
                <div className={`relative w-24 h-24 rounded-full flex items-center justify-center shadow-xl ${isPendingApproval ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-200/50' : 'bg-gradient-to-br from-green-400 to-emerald-500 shadow-green-200/50'}`}>
                  {isPendingApproval ? <Clock3 size={46} className="text-white" strokeWidth={2.5} /> : <CheckCircle2 size={48} className="text-white" strokeWidth={2.5} />}
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                  {isPendingApproval ? 'Approval Still Needed' : isConnected ? 'Account Linked' : 'Connection Saved'}
                </h3>
                <div className="flex flex-col items-center gap-2">
                  <p className="text-slate-500 font-medium tracking-tight">
                    {result?.message || `Your ${platform.name} account has been processed.`}
                  </p>
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${isPendingApproval ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-blue-50 text-blue-600 border-blue-100/50'}`}>
                    {isPendingApproval ? <Clock3 size={12} /> : <RefreshCcw size={12} className={result?.details?.syncStatus === 'syncing' ? 'animate-spin' : ''} />}
                    {isPendingApproval ? 'Waiting for Approval' : result?.details?.syncStatus === 'syncing' ? 'Data Sync in Progress' : 'Ready to Use'}
                  </div>
                  
                  {result?.details?.syncStatus === 'syncing' && (
                    <div className="w-64 mt-4 space-y-2">
                      <div className="flex justify-between text-[10px] font-bold text-slate-400">
                        <span>Syncing History</span>
                        <span>{(() => {
                          const integration = integrations.find(i => i.platform_id === platform.id);
                          return (integration?.config?.sync_progress as number) || 0;
                        })()}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 transition-all duration-500" 
                          style={{ width: `${(() => {
                            const integration = integrations.find(i => i.platform_id === platform.id);
                            return (integration?.config?.sync_progress as number) || 0;
                          })()}%` }} 
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {sampleData && (
                <div className="bg-slate-50 rounded-[28px] p-7 border border-slate-100 text-left space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Initial Data Preview</h4>
                    <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">Live</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {Object.entries(Array.isArray(sampleData) ? (sampleData[0] || {}) : sampleData).map(([key, value], index) => (
                      <div
                        key={`${key}-${index}`}
                        className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300"
                        style={{ animationDelay: `${index * 100 + 300}ms`, animationFillMode: 'both' }}
                      >
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 truncate">{key.replace(/_/g, ' ')}</p>
                        <p className="text-xl font-black text-slate-900">
                          {typeof value === 'number'
                            ? value >= 10000
                              ? `${(value / 1000).toFixed(1)}k`
                              : value >= 1000
                                ? value.toLocaleString()
                                : Number.isInteger(value)
                                  ? value
                                  : value.toFixed(2)
                            : typeof value === 'object' 
                              ? 'Data'
                              : String(value)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  onSuccess();
                  onClose();
                }}
                className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black text-lg shadow-xl shadow-slate-900/20 hover:bg-slate-800 hover:scale-[1.01] active:scale-[0.99] transition-all"
              >
                Return to Integrations
              </button>
            </div>
          )}
        </div>

        {!isSuccess && !(platform.id === 'meta_ads' && currentStep?.type === 'oauth') && (
          <div className="px-8 py-5 bg-slate-50/60 border-t border-slate-100/50 flex items-center justify-between">
            <button
              disabled={step === 0 || loading}
              onClick={handleBack}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold text-slate-400 hover:text-slate-900 hover:bg-white disabled:opacity-20 disabled:pointer-events-none transition-all"
            >
              <ChevronLeft size={18} />
              Back
            </button>
            <button
              disabled={loading || !canProceed()}
              onClick={() => void handleNext()}
              className={`
                flex items-center gap-2 px-8 py-3 rounded-2xl text-sm font-black shadow-lg transition-all duration-300
                ${canProceed() && !loading
                  ? 'bg-brand-primary text-white shadow-red-200/50 hover:bg-brand-primary/90 hover:scale-[1.02] active:scale-[0.98]'
                  : 'bg-slate-200 text-slate-400 shadow-none cursor-not-allowed'}
              `}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Checking connection...</span>
                </>
              ) : (
                <>
                  {isLastStep ? 'Verify Connection' : 'Continue'}
                  <ChevronRight size={18} />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
