import React from 'react';
import { 
  AlertCircle, 
  RefreshCcw, 
  ChevronRight,
  Link2
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type IntegrationStatus = 'connected' | 'syncing' | 'error' | 'available' | 'pending_approval';

interface IntegrationCardProps {
  name: string;
  icon: React.ReactNode;
  id?: string;
  status: IntegrationStatus;
  statusText?: string;
  lastSynced?: string;
  progress?: number;
  sourceHint?: string;
  onConnect?: () => void;
  onEditSettings?: () => void;
  onResync?: () => void;
  onRetrySync?: () => void;
  onViewDetails?: () => void;
}

export const IntegrationCard = ({ 
  name, 
  icon, 
  id, 
  status, 
  statusText, 
  lastSynced,
  progress,
  sourceHint,
  onConnect,
  onEditSettings,
  onResync,
  onRetrySync,
  onViewDetails,
}: IntegrationCardProps) => {
  const syncProgress = typeof progress === 'number' ? progress : 35;
  const isSyncFailed = status === 'error' && statusText?.toLowerCase().includes('sync failed');

  return (
    <div className={cn(
      "bg-white border rounded-2xl p-6 transition-all duration-300 flex flex-col h-full group",
      status === 'error' ? "border-red-100 shadow-sm" : "border-slate-100 shadow-sm hover:shadow-md",
      status === 'available' ? "border-dashed" : ""
    )}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center p-2.5">
          {icon}
        </div>
        <div className="flex items-center gap-2">
           {status === 'connected' && (
             <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
               <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
               Connected
             </span>
           )}
           {status === 'syncing' && (
             <span className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
               <RefreshCcw className="w-2.5 h-2.5 animate-spin" />
               Syncing
             </span>
           )}
            {status === 'error' && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
                <AlertCircle className="w-2.5 h-2.5" />
                {isSyncFailed ? 'Sync Failed' : 'Error'}
              </span>
            )}
            {status === 'pending_approval' && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-[10px] font-bold uppercase tracking-wider border border-amber-100">
                <AlertCircle className="w-2.5 h-2.5" />
                Pending Approval
              </span>
            )}
            {status === 'available' && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 text-slate-500 rounded-full text-[10px] font-bold uppercase tracking-wider border border-slate-100">
                Available
              </span>
            )}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-1 mb-6 flex-1">
        <h3 className="text-lg font-bold text-slate-900 leading-tight">{name}</h3>
        {id && <p className="text-xs text-slate-400 font-medium tracking-tight">ID: {id}</p>}
        {statusText && <p className={cn(
            "text-xs mt-2 font-medium",
            status === 'error' ? "text-red-500" : status === 'pending_approval' ? "text-amber-700" : "text-slate-500"
        )}>{statusText}</p>}
        {sourceHint && (
          <span className="inline-flex w-fit mt-3 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-[10px] font-bold uppercase tracking-wider border border-blue-100">
            {sourceHint}
          </span>
        )}
      </div>

      {/* Footer / Actions */}
      <div className="pt-6 border-t border-slate-50 mt-auto">
        {status === 'connected' && (
          <div className="space-y-4">
             <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span className="flex items-center gap-1.5"><RefreshCcw size={10} /> Last synced {lastSynced}</span>
             </div>
             <div className="flex gap-2">
                <button onClick={onEditSettings} className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                    Edit Settings
                </button>
                <button onClick={onResync} className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors">
                    <RefreshCcw size={16} />
                </button>
             </div>
          </div>
        )}

         {status === 'syncing' && (
            <div className="space-y-4">
               <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold">
                     <span className="text-blue-600">Processing data...</span>
                    <span className="text-slate-400">{syncProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ width: `${syncProgress}%` }} />
                  </div>
               </div>
               <button 
                  onClick={onViewDetails}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
               >
                   View Details
               </button>
            </div>
         )}

         {status === 'pending_approval' && (
            <div className="space-y-4">
               <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">Action needed in the ad platform</p>
               <button
                  onClick={onConnect}
                  className="w-full px-4 py-2.5 bg-amber-50 border border-amber-100 text-amber-700 rounded-xl text-xs font-bold hover:bg-amber-100 transition-colors flex items-center justify-center gap-2"
               >
                  Review steps <ChevronRight size={14} />
               </button>
            </div>
         )}

        {status === 'error' && (
            <div className="space-y-4">
               {isSyncFailed ? (
                 <>
                   <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Sync failed — data may be stale</p>
                   <button 
                      onClick={onRetrySync || onConnect}
                      className="w-full px-4 py-2.5 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                   >
                      <RefreshCcw size={14} /> Retry Sync
                   </button>
                   {onEditSettings && (
                     <button 
                        onClick={onEditSettings}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
                     >
                        Change Account ID
                     </button>
                   )}
                 </>
               ) : (
                 <>
                   <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Re-authentication required</p>
                   <button 
                      onClick={onConnect}
                      className="w-full px-4 py-2.5 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                   >
                      Reconnect <ChevronRight size={14} />
                   </button>
                 </>
               )}
            </div>
        )}

        {status === 'available' && (
            <button 
                onClick={onConnect}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
                <Link2 size={14} />
                Connect
            </button>
        )}
      </div>
    </div>
  );
};
