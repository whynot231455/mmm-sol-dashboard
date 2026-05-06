import React from 'react';
import { RefreshCw, Zap } from 'lucide-react';
import { useDataStore } from '../store/useDataStore';

export const IngestionFeedWidget: React.FC = () => {
  const { integrations } = useDataStore();
  
  // Find active syncs
  const activeSyncs = Object.values(integrations).filter(i => i.syncStatus === 'SYNCING');
  
  if (activeSyncs.length === 0) return null;

  return (
    <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-800 animate-in slide-in-from-right-4 duration-500">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-brand-primary/20 rounded-lg">
          <RefreshCw size={16} className="text-brand-primary animate-spin" />
        </div>
        <div>
          <h4 className="text-xs font-black uppercase tracking-wider">Live Ingestion Feed</h4>
          <p className="text-[10px] font-bold text-slate-400">Real-time platform handshake</p>
        </div>
      </div>

      <div className="space-y-3">
        {activeSyncs.map((sync) => (
          <div key={sync.platformId} className="space-y-2">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
              <span className="text-slate-300">{sync.platformId.replace('_', ' ')}</span>
              <span className="text-brand-primary">{sync.ingestionProgress}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-brand-primary transition-all duration-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                style={{ width: `${sync.ingestionProgress}%` }}
              />
            </div>
            <div className="flex items-center gap-2 text-[9px] font-bold text-slate-500">
              <Zap size={10} className="text-brand-primary animate-pulse" />
              <span>Fetching historical ROAS data...</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
