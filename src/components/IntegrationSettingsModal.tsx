import React, { useState, useEffect } from 'react';
import { X, RefreshCcw, AlertCircle, Trash2, CheckCircle2 } from 'lucide-react';
import { useDataStore, type Integration } from '../store/useDataStore';
import { integrationApi } from '../services/integrationApi';

interface IntegrationSettingsModalProps {
  integration: Integration;
  onClose: () => void;
}

export const IntegrationSettingsModal: React.FC<IntegrationSettingsModalProps> = ({ integration, onClose }) => {
  const [accountId, setAccountId] = useState(integration?.account_id || '');
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const { addIntegration, removeIntegration, fetchIntegrations } = useDataStore();

  useEffect(() => {
    setAccountId(integration?.account_id || '');
  }, [integration]);

  if (!integration) return null;

  const handleResync = async () => {
    setIsSyncing(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const config = { ...integration.config, accountId };
      const validationResult = await integrationApi.testConnection(integration.platform_id, config);
      
      if (validationResult.result === 'error' || validationResult.result === 'invalid_account' || validationResult.result === 'unsupported') {
        setError(validationResult.message);
        return;
      }

      await addIntegration({
        platform_id: integration.platform_id,
        status: validationResult.result === 'connected' ? 'connected' : 'pending_approval',
        account_name: validationResult.accountName || integration.account_name,
        account_id: validationResult.externalAccountId || accountId || 'Unknown',
        config: {
          ...config,
          last_result: validationResult.result,
          last_message: validationResult.message,
          details: validationResult.details || {},
        },
        last_synced_at: validationResult.result === 'connected' ? new Date().toISOString() : null,
      });

      setSuccessMsg('Integration successfully synchronized.');
      fetchIntegrations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync. Please check your settings.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (confirm('Are you sure you want to disconnect this integration?')) {
      await removeIntegration(integration.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div className="relative bg-white w-full max-w-md rounded-2xl shadow-xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Integration Settings</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Account ID</label>
              <input
                type="text"
                value={accountId}
                onChange={e => setAccountId(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-start gap-2 p-3 bg-green-50 text-green-700 rounded-xl text-sm font-medium">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="flex flex-col gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={handleResync}
              disabled={isSyncing}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-primary text-white rounded-xl text-sm font-bold shadow-md shadow-brand-primary/20 hover:bg-brand-primary/90 disabled:opacity-50 transition-all"
            >
              {isSyncing ? <RefreshCcw size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
              {isSyncing ? 'Syncing...' : 'Re-sync Data'}
            </button>
            <button
              onClick={handleDisconnect}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-red-200 text-red-600 rounded-xl text-sm font-bold hover:bg-red-50 transition-all"
            >
              <Trash2 size={16} />
              Disconnect
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
