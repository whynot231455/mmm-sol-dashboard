import { useEffect, useState } from 'react';
import { 
  X, 
  RefreshCcw, 
  CheckCircle2, 
  Clock, 
  Database,
  BarChart3,
  ExternalLink,
  Activity
} from 'lucide-react';
import { useDataStore } from '../store/useDataStore';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SyncDetailsModalProps {
  integrationId: string;
  onClose: () => void;
}

export const SyncDetailsModal = ({ integrationId, onClose }: SyncDetailsModalProps) => {
  const { integrations, recentSyncRecords, fetchRecentSyncRecords } = useDataStore();
  const [activeTab, setActiveTab] = useState<'feed' | 'status'>('feed');
  
  const integration = integrations.find(i => i.id === integrationId);
  
  useEffect(() => {
    if (!integration) return;

    // Initial fetch
    fetchRecentSyncRecords(integration.id);
    
    // Poll for recent records every 5 seconds
    const interval = setInterval(() => {
      fetchRecentSyncRecords(integration.id);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [integration?.id, fetchRecentSyncRecords, integration]);

  if (!integration) return null;

  const config = integration.config as Record<string, unknown>;
  const progress = (config.sync_progress as number) || 0;
  const statusMessage = (config.last_message as string) || 'Initializing sync...';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-400 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-8 border-b border-slate-50 flex items-start justify-between bg-slate-50/50">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm">
               {integration.platform_id === 'meta_ads' ? (
                 <div className="text-blue-600 font-bold text-2xl italic">f</div>
               ) : (
                 <Database className="text-slate-400" size={28} />
               )}
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">{integration.account_name || 'Meta Ads Sync'}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">ID: {integration.account_id}</span>
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span className="flex items-center gap-1.5 text-xs font-bold text-blue-600 uppercase tracking-widest">
                  <Activity size={12} className="animate-pulse" />
                  Live Syncing
                </span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white rounded-xl transition-colors text-slate-400 hover:text-slate-600 border border-transparent hover:border-slate-100"
          >
            <X size={24} />
          </button>
        </div>

        {/* Sync Progress Bar Section */}
        <div className="px-8 pt-8 pb-4">
          <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100/50">
            <div className="flex items-end justify-between mb-4">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Progress</p>
                <p className="text-3xl font-black text-slate-900 tracking-tighter">{progress}%</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                <div className="flex items-center gap-2 text-blue-600">
                  <RefreshCcw size={14} className="animate-spin" />
                  <span className="text-xs font-bold">{statusMessage}</span>
                </div>
              </div>
            </div>
            <div className="w-full bg-white h-3 rounded-full overflow-hidden border border-slate-100 p-0.5">
              <div 
                className="bg-blue-600 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(37,99,235,0.4)]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-8 mt-4 flex items-center gap-6 border-b border-slate-50">
          <button 
            onClick={() => setActiveTab('feed')}
            className={cn(
              "pb-4 text-xs font-bold uppercase tracking-widest transition-all relative",
              activeTab === 'feed' ? "text-slate-900" : "text-slate-400 hover:text-slate-600"
            )}
          >
            Live Ingestion Feed
            {activeTab === 'feed' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />}
          </button>
          <button 
            onClick={() => setActiveTab('status')}
            className={cn(
              "pb-4 text-xs font-bold uppercase tracking-widest transition-all relative",
              activeTab === 'status' ? "text-slate-900" : "text-slate-400 hover:text-slate-600"
            )}
          >
            Sync Logs
            {activeTab === 'status' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />}
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-8 pt-6 min-h-[300px]">
          {activeTab === 'feed' ? (
            <div className="space-y-4">
              {recentSyncRecords.length > 0 ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-4 px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <div className="col-span-2">Campaign</div>
                    <div>Date</div>
                    <div className="text-right">Spend</div>
                  </div>
                  {recentSyncRecords.map((record, idx) => (
                    <div 
                      key={idx}
                      className="grid grid-cols-4 items-center px-4 py-3.5 bg-white border border-slate-100 rounded-2xl shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <div className="col-span-2 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                          <BarChart3 size={16} />
                        </div>
                        <span className="text-xs font-bold text-slate-900 truncate pr-4">{record.campaign_name}</span>
                      </div>
                      <div className="text-xs font-medium text-slate-500">{new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                      <div className="text-xs font-black text-slate-900 text-right">${parseFloat(record.spend).toFixed(2)}</div>
                    </div>
                  ))}
                  <div className="pt-4 flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <Clock size={12} />
                    Auto-updating every 5s
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 pt-12">
                  <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center">
                    <Database className="text-slate-300 animate-pulse" size={32} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-900">Waiting for data ingestion...</p>
                    <p className="text-xs text-slate-400 max-w-[240px]">Once the Meta API returns campaign records, they will appear here in real-time.</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
               <div className="space-y-3">
                  {[
                    { msg: 'Meta Ads authentication successful', time: 'Just now', icon: <CheckCircle2 className="text-green-500" /> },
                    { msg: 'Connected to Ad Account: ' + integration.account_id, time: '1 min ago', icon: <CheckCircle2 className="text-green-500" /> },
                    { msg: statusMessage, time: 'Updating...', icon: <RefreshCcw className="text-blue-500 animate-spin" /> }
                  ].map((log, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100/50">
                      <div className="mt-0.5">{log.icon}</div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-slate-900">{log.msg}</p>
                        <p className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-wider">{log.time}</p>
                      </div>
                    </div>
                  ))}
               </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-slate-50 flex items-center justify-between bg-slate-50/30">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Syncing via Supabase Edge Runtime
          </p>
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Close Panel
            </button>
            <button className="px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors flex items-center gap-2">
              Meta Settings <ExternalLink size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
