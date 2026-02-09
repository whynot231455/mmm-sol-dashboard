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

export type IntegrationStatus = 'connected' | 'syncing' | 'error' | 'available';

interface IntegrationCardProps {
  name: string;
  icon: React.ReactNode;
  id?: string;
  status: IntegrationStatus;
  statusText?: string;
  lastSynced?: string;
  progress?: number;
}

export const IntegrationCard = ({ 
  name, 
  icon, 
  id, 
  status, 
  statusText, 
  lastSynced,
  progress,
}: IntegrationCardProps) => {
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
               Error
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
            status === 'error' ? "text-red-500" : "text-slate-500"
        )}>{statusText}</p>}
      </div>

      {/* Footer / Actions */}
      <div className="pt-6 border-t border-slate-50 mt-auto">
        {status === 'connected' && (
          <div className="space-y-4">
             <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span className="flex items-center gap-1.5"><RefreshCcw size={10} /> Last synced {lastSynced}</span>
             </div>
             <div className="flex gap-2">
                <button className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                    Edit Settings
                </button>
                <button className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors">
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
                    <span className="text-slate-400">{progress}%</span>
                 </div>
                 <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                 </div>
              </div>
              <button className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                  View Details
              </button>
           </div>
        )}

        {status === 'error' && (
            <div className="space-y-4">
               <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest underline decoration-red-200 cursor-pointer">Re-authentication required</p>
               <button className="w-full px-4 py-2.5 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-2">
                  Reconnect <ChevronRight size={14} />
               </button>
            </div>
        )}

        {status === 'available' && (
            <button className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 shadow-sm">
                <Link2 size={14} />
                Connect
            </button>
        )}
      </div>
    </div>
  );
};
