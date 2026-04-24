import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Shield, ChevronRight, Globe } from 'lucide-react';
import { integrationApi, type MetaOAuthAccountOption } from '../services/integrationApi';
import { useDataStore } from '../store/useDataStore';

export const AuthCallbackPage: React.FC = () => {
  const { setActivePage } = useDataStore();
  const [loading, setLoading] = useState(true);
  const [finalizing, setFinalizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('Completing Meta login...');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [metaUserName, setMetaUserName] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<MetaOAuthAccountOption[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const completionKeyRef = useRef<string | null>(null);

  const query = useMemo(() => new URLSearchParams(window.location.search), []);
  const code = query.get('code');
  const state = query.get('state');
  const oauthError = query.get('error') || query.get('error_reason');
  const oauthErrorDescription = query.get('error_description');

  useEffect(() => {
    if (oauthError) {
      setError(oauthErrorDescription || oauthError || 'Meta login failed.');
      setLoading(false);
      return;
    }

    if (!code || !state) {
      setError('The Meta callback is missing its authorization code. Please try connecting again.');
      setLoading(false);
      return;
    }

    const completionKey = `${code}:${state}`;
    if (completionKeyRef.current === completionKey) {
      return;
    }
    completionKeyRef.current = completionKey;

    void (async () => {
      try {
        const result = await integrationApi.completeMetaOAuth({ code, state });
        setSessionId(result.sessionId);
        setMetaUserName(result.metaUserName);
        setAccounts(result.accounts);
        setSelectedAccountId(result.accounts[0]?.accountId || '');
        setMessage(result.message);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to complete Meta OAuth.');
      } finally {
        setLoading(false);
      }
    })();
  }, [code, oauthError, oauthErrorDescription, state]);

  const handleFinalize = async (accountId: string) => {
    if (!sessionId) return;

    setFinalizing(true);
    setError(null);

    try {
      const result = await integrationApi.finalizeMetaOAuth({ sessionId, accountId });
      setMessage(result.message);
      setActivePage('connect');
      window.location.assign('/?page=connect');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save your Meta connection.');
    } finally {
      setFinalizing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe,_#f8fafc_35%,_#eef2ff_70%,_#ffffff)] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-2xl bg-white/90 backdrop-blur-xl rounded-[32px] p-8 sm:p-10 shadow-2xl shadow-slate-200/60 border border-white/70 space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <Globe className="w-7 h-7" />
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Meta Ads OAuth</p>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Finish connection</h2>
          </div>
        </div>

        {loading ? (
          <div className="rounded-3xl bg-slate-50 border border-slate-100 p-8 flex items-center gap-4">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            <div>
              <p className="font-bold text-slate-900">{message}</p>
              <p className="text-sm text-slate-500">We’re exchanging your Facebook login for a secure server-side token.</p>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-3xl bg-red-50 border border-red-100 p-6 space-y-3">
            <div className="flex items-center gap-3 text-red-700 font-bold">
              <AlertCircle className="w-5 h-5" />
              Something blocked the Meta connection
            </div>
            <p className="text-sm text-red-700/90 leading-relaxed">{error}</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-3xl bg-emerald-50 border border-emerald-100 p-6 flex items-start gap-4">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="font-black text-emerald-900">Facebook login succeeded</p>
                <p className="text-sm text-emerald-800/80">
                  {metaUserName ? `Signed in as ${metaUserName}.` : 'Select the Meta ad account you want to connect.'}
                </p>
              </div>
            </div>

            <div className="rounded-3xl bg-slate-50 border border-slate-100 p-6 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Choose account</p>
                  <h3 className="text-xl font-black text-slate-900">Which Ad Account should we sync?</h3>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-500">
                  <Shield className="w-3.5 h-3.5" />
                  Server-side token storage
                </div>
              </div>

              <div className="space-y-3">
                {accounts.map((account) => (
                  <button
                    key={account.id}
                    onClick={() => setSelectedAccountId(account.accountId)}
                    className={`w-full text-left rounded-2xl border px-4 py-4 transition-all ${
                      selectedAccountId === account.accountId
                        ? 'border-blue-300 bg-blue-50 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-bold text-slate-900">{account.name}</p>
                        <p className="text-sm text-slate-500">act_{account.accountId}</p>
                      </div>
                      {selectedAccountId === account.accountId ? (
                        <CheckCircle2 className="w-5 h-5 text-blue-600" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-slate-300" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {accounts.length === 0 && (
                <p className="text-sm text-slate-500">No accessible ad accounts were returned for this login.</p>
              )}

              <button
                onClick={() => void handleFinalize(selectedAccountId)}
                disabled={!selectedAccountId || finalizing}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-brand-primary text-white font-bold shadow-lg shadow-red-200/50 hover:bg-brand-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {finalizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Connect selected account
              </button>
            </div>
          </div>
        )}

        {!loading && !error && (
          <div className="text-xs text-slate-400 font-medium leading-relaxed">
            {message}
          </div>
        )}
      </div>
    </div>
  );
};
