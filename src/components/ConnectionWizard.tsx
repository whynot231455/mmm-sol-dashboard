import { useState, useEffect } from 'react';
import { X, CheckCircle2, ExternalLink, ArrowRight, Info, Database,  Zap,
  Settings,
  ShieldCheck,
  RefreshCw,
  Trash2,
  Lock,
} from 'lucide-react';

interface ConnectionWizardProps {
  platform: {
    id: string;
    name: string;
    icon: React.ReactNode;
  } | null;
  mode?: 'connect' | 'manage';
  onClose: () => void;
  onSuccess: (platformId: string, months: number) => void;
  onDisconnect: (platformId: string) => void;
}

type WizardStep = 'guide' | 'input' | 'connecting' | 'success' | 'manage';

export const ConnectionWizard = ({ platform, mode = 'connect', onClose, onSuccess, onDisconnect }: ConnectionWizardProps) => {
  const [step, setStep] = useState<WizardStep>(mode === 'manage' ? 'manage' : 'guide');
  const [accountId, setAccountId] = useState('');
  const [timeRange, setTimeRange] = useState<number>(24);
  const [ingestionProgress, setIngestionProgress] = useState(0);

  useEffect(() => {
    if (step === 'connecting') {
      const timer = setTimeout(() => {
        setStep('success');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  useEffect(() => {
    if (step === 'success') {
      const interval = setInterval(() => {
        setIngestionProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 5;
        });
      }, 150);
      return () => clearInterval(interval);
    }
  }, [step]);

  // Reset state when modal is closed (platform becomes null)
  useEffect(() => {
    if (!platform) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStep(mode === 'manage' ? 'manage' : 'guide');
      setAccountId('');
      setTimeRange(24);
      setIngestionProgress(0);
    }
  }, [platform, mode]);

  // Ensure step updates if mode changes while platform is active
  useEffect(() => {
    if (platform) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStep(mode === 'manage' ? 'manage' : 'guide');
    }
  }, [mode, platform]);

  if (!platform) return null;

  const handleConnect = () => {
    if (!accountId) return;
    setStep('connecting');
  };

  const handleSync = () => {
    setIngestionProgress(0);
    setStep('connecting');
  };

  const handleDisconnectAction = () => {
    onDisconnect(platform.id);
    onClose();
  };

  const platformGuides: Record<string, { title: string; steps: string[] }> = {
    google_ads: {
      title: "Find your Google Ads Customer ID",
      steps: [
        "Sign in to your Google Ads account.",
        "Look at the top right corner of any page.",
        "Your Customer ID is the 10-digit number (e.g., 123-456-7890).",
        "Copy and paste it into the next step."
      ],
    },
    meta_ads: {
      title: "Find your Meta Ads Account ID",
      steps: [
        "Go to Meta Ads Manager.",
        "Click the account dropdown menu in the top left.",
        "The ID is shown next to your account name.",
        "Alternatively, find it in 'Account Settings' under 'Ad Account ID'."
      ],
    },
    default: {
      title: "How to connect",
      steps: [
        "Navigate to the official platform dashboard.",
        "Look for 'API Access' or 'Account Settings'.",
        "Locate your unique Account or Client ID.",
        "Paste it into our secure connection field."
      ]
    }
  };

  const guide = platformGuides[platform.id] || platformGuides.default;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl shadow-slate-900/20 overflow-hidden animate-in zoom-in-95 fade-in duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
              {platform.icon}
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                {step === 'manage' ? `Manage ${platform.name}` : `Connect ${platform.name}`}
              </h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                {step === 'manage' && "Active Integration"}
                {step === 'guide' && "Step 1: Preparation"}
                {step === 'input' && "Step 2: Authenticate"}
                {step === 'connecting' && "Verification in progress"}
                {step === 'success' && "Connection Established"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {step === 'manage' && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase tracking-wider border border-green-100">
                <ShieldCheck size={12} />
                Connected
              </div>
            )}
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {step === 'manage' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Account ID</span>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900">742-819-2041</span>
                      <Lock size={14} className="text-slate-300" />
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Client Secret</span>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900">••••••••••••••••</span>
                      <Lock size={14} className="text-slate-300" />
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-brand-primary/5 rounded-[2rem] border border-brand-primary/10 space-y-4">
                  <div className="flex items-center gap-2 text-brand-primary">
                    <Info size={18} />
                    <h4 className="text-xs font-black uppercase tracking-wider">Management Help</h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    To rotate your client secrets or change permissions, please visit the <strong>{platform.name} Developer Console</strong>. Updates made there will automatically sync here during the next handshake.
                  </p>
                  <button className="text-[10px] font-black text-brand-primary hover:underline uppercase tracking-widest flex items-center gap-1">
                    View Documentation <ExternalLink size={10} />
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => setStep('guide')}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl shadow-slate-900/10 flex items-center justify-center gap-3 hover:bg-slate-800 transition-all active:scale-95"
                >
                  <Settings size={18} />
                  Reconfigure Integration
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={handleSync}
                    className="py-3 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-2 transition-all"
                  >
                    <RefreshCw size={14} />
                    Sync Data
                  </button>
                  <button 
                    onClick={handleDisconnectAction}
                    className="py-3 bg-white border border-red-100 rounded-xl text-xs font-black text-red-500 hover:bg-red-50 flex items-center justify-center gap-2 transition-all"
                  >
                    <Trash2 size={14} />
                    Disconnect
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 'guide' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-900 leading-tight">{guide.title}</h3>
                <div className="space-y-3">
                  {guide.steps.map((s, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center text-xs font-black">
                        {i + 1}
                      </div>
                      <p className="text-sm text-slate-600 font-medium leading-relaxed">{s}</p>
                    </div>
                  ))}
                </div>
                <div className="pt-4">
                  <a 
                    href="#" 
                    className="inline-flex items-center gap-2 text-xs font-bold text-brand-primary hover:underline"
                  >
                    Visit {platform.name} Dashboard <ExternalLink size={12} />
                  </a>
                </div>
              </div>
              
              <div className="pt-6 flex justify-end">
                <button 
                  onClick={() => setStep('input')}
                  className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-900/10"
                >
                  I have my ID <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {step === 'input' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300 py-4">
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Enter Account ID</h3>
                <p className="text-sm text-slate-500 font-medium max-w-sm mx-auto">
                  Paste the ID you found in the previous step to start the secure handshake.
                </p>
              </div>

              <div className="max-w-md mx-auto space-y-4">
                <div className="relative">
                  <Database className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input 
                    type="text"
                    placeholder="e.g. 123-456-7890"
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-black tracking-wider outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all text-slate-900 placeholder:text-slate-300 placeholder:font-bold"
                  />
                </div>

                <div className="space-y-2 text-left">
                   <label className="text-sm font-bold text-slate-700 ml-1">Data Time Range</label>
                   <select 
                     value={timeRange} 
                     onChange={(e) => setTimeRange(Number(e.target.value))}
                     className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all text-slate-900 cursor-pointer"
                   >
                      <option value={3}>Last 3 Months</option>
                      <option value={6}>Last 6 Months</option>
                      <option value={12}>Last 12 Months</option>
                      <option value={24}>Last 24 Months</option>
                      <option value={36}>Last 36 Months</option>
                   </select>
                </div>
                
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                  <Info className="text-amber-500 flex-shrink-0" size={20} />
                  <p className="text-xs text-amber-700 font-bold leading-relaxed uppercase tracking-wide">
                    By connecting, you authorize our platform to read performance data and metadata for analysis purposes. We will never modify your ad settings.
                  </p>
                </div>

                <div className="pt-6 flex flex-col gap-3">
                  <button 
                    onClick={handleConnect}
                    disabled={!accountId}
                    className="w-full py-4 bg-brand-primary text-white rounded-2xl font-black shadow-xl shadow-brand-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
                  >
                    Authorize & Connect
                  </button>
                  <button 
                    onClick={() => setStep('guide')}
                    className="w-full py-3 text-slate-400 font-bold text-sm hover:text-slate-600"
                  >
                    Go back to guide
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 'connecting' && (
            <div className="py-12 text-center space-y-8 animate-in fade-in duration-500">
              <div className="relative inline-block">
                <div className="w-24 h-24 rounded-full border-4 border-slate-100 border-t-brand-primary animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Zap className="text-brand-primary animate-pulse" size={32} fill="currentColor" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900">Verifying Handshake</h3>
                <p className="text-sm text-slate-500 font-medium">Establishing a secure OAuth2 tunnel to {platform.name}...</p>
              </div>
              <div className="max-w-xs mx-auto space-y-3">
                 {[
                   "Validating Account ID...",
                   "Requesting secure token...",
                   "Exchanging credentials..."
                 ].map((text, i) => (
                   <div key={i} className="flex items-center gap-3 text-left animate-in slide-in-from-left-4 duration-500" style={{ animationDelay: `${i * 0.5}s` }}>
                     <CheckCircle2 className="text-slate-300" size={16} />
                     <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{text}</span>
                   </div>
                 ))}
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="py-4 space-y-10 animate-in fade-in zoom-in-95 duration-500">
              {/* Success Banner */}
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-50 text-emerald-500 mb-2">
                   <CheckCircle2 size={48} />
                </div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">Platform Connected!</h3>
                <p className="text-slate-500 font-medium text-lg">
                  You have successfully connected to {platform.name}.
                </p>
              </div>

              {/* Ingestion Section */}
              <div className="p-8 bg-slate-50 rounded-[32px] border border-slate-100 space-y-6">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <div className="p-2 bg-brand-primary/10 text-brand-primary rounded-lg">
                          <Database size={20} />
                       </div>
                       <div>
                          <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">Initial Data Ingestion</h4>
                          <p className="text-xs font-bold text-slate-400">Syncing historical performance data</p>
                       </div>
                    </div>
                    <span className="text-sm font-black text-brand-primary">{ingestionProgress}%</span>
                 </div>

                 <div className="space-y-4">
                    <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden">
                       <div 
                         className="h-full bg-brand-primary transition-all duration-300 ease-out shadow-lg shadow-brand-primary/20"
                         style={{ width: `${ingestionProgress}%` }}
                       />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                       <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Status</span>
                          <div className="flex items-center gap-2">
                             <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                             <span className="text-sm font-black text-slate-900">{ingestionProgress === 100 ? "Complete" : "Ingesting..."}</span>
                          </div>
                       </div>
                       <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Time Range</span>
                          <span className="text-sm font-black text-slate-900">Last {timeRange} Months</span>
                       </div>
                    </div>
                 </div>

                 {ingestionProgress === 100 && (
                   <div className="pt-4 animate-in slide-in-from-bottom-2 duration-500">
                      <button 
                        onClick={() => {
                          onSuccess(platform.id, timeRange);
                          onClose();
                        }}
                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-all active:scale-95"
                      >
                        Go to Dashboard
                      </button>
                   </div>
                 )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
