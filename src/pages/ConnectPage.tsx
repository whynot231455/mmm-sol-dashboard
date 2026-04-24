import { useState, useMemo, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  LayoutGrid, 
  ChevronRight,
  MonitorPlay,
  Globe,
  Database,

  Link2,
  Megaphone,
  UserCheck,
  Package
} from 'lucide-react';
import { useDataStore, type Integration } from '../store/useDataStore';
import { integrationApi } from '../services/integrationApi';
import { IntegrationCard, type IntegrationStatus } from '../components/IntegrationCard';
import { IntegrationWizard } from '../components/IntegrationWizard';
import { IntegrationSettingsModal } from '../components/IntegrationSettingsModal';
import { SyncDetailsModal } from '../components/SyncDetailsModal';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { toast } from 'sonner';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const ConnectPage = () => {
  const { rawData, mapping, integrations: dbIntegrations, fetchIntegrations, addIntegration } = useDataStore();
  const [activeTab, setActiveTab] = useState('All Sources');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<{ id: string; name: string; icon: React.ReactNode } | null>(null);
  const [editingIntegration, setEditingIntegration] = useState<Integration | null>(null);
  const [viewingSyncId, setViewingSyncId] = useState<string | null>(null);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  useEffect(() => {
    const { startPollingIntegrations, stopPollingIntegrations } = useDataStore.getState();
    startPollingIntegrations();
    return () => stopPollingIntegrations();
  }, []);

  // Detect connected channels from CSV
  const csvConnectedChannels = useMemo(() => {
    if (!rawData.length || !mapping.channel) return new Set<string>();
    const channels = rawData.map(row => String(row[mapping.channel!] || '').toLowerCase());
    return new Set(channels);
  }, [rawData, mapping.channel]);

  const integrationDefinitions = useMemo(() => [
    {
      platformId: 'google_ads',
      name: 'Google Ads',
      type: 'Paid Media',
      icon: <Megaphone className="text-blue-500" />,
      matchNames: ['google ads', 'adwords', 'search ads']
    },
    {
      platformId: 'meta_ads',
      name: 'Meta Ads',
      type: 'Paid Media',
      icon: <div className="text-blue-600 font-bold text-lg italic">f</div>,
      matchNames: ['meta ads', 'facebook ads', 'instagram ads', 'facebook']
    },
    {
      platformId: 'linkedin_ads',
      name: 'LinkedIn Ads',
      type: 'Paid Media',
      icon: <div className="bg-blue-700 text-white p-1 rounded-sm"><Link2 size={12} /></div>,
      matchNames: ['linkedin ads', 'linkedin']
    },
    {
      platformId: 'salesforce',
      name: 'Salesforce',
      type: 'CRM & Sales',
      icon: <Database className="text-blue-400" />,
      matchNames: ['salesforce', 'crm']
    },
    {
      platformId: 'tiktok_ads',
      name: 'TikTok Ads',
      type: 'Paid Media',
      icon: <MonitorPlay className="text-black" />,
      matchNames: ['tiktok ads', 'tiktok']
    },
    {
      platformId: 'hubspot',
      name: 'HubSpot',
      type: 'CRM & Sales',
      icon: <UserCheck className="text-orange-500" />,
      matchNames: ['hubspot']
    },
    {
      platformId: 'shopify',
      name: 'Shopify',
      type: 'E-commerce',
      icon: <Package className="text-green-600" />,
      matchNames: ['shopify']
    },
    {
      platformId: 'twitter_ads',
      name: 'Twitter / X Ads',
      type: 'Paid Media',
      icon: <Globe className="text-slate-800" />,
      matchNames: ['twitter ads', 'x ads', 'twitter']
    }
  ], []);

  const mergedIntegrations = useMemo(() => {
    return integrationDefinitions.map(def => {
      const dbMatch = dbIntegrations.find(i => i.platform_id === def.platformId);
      const csvMatch = def.matchNames.some(name => csvConnectedChannels.has(name));
      
      let status: IntegrationStatus = 'available';
      let id = undefined;
      let lastSynced = undefined;
      let statusText = undefined;
      let sourceHint = undefined;
      let progress = undefined;

      if (dbMatch) {
        status = dbMatch.status;
        id = dbMatch.account_id;
        lastSynced = dbMatch.last_synced_at ? new Date(dbMatch.last_synced_at).toLocaleDateString() : 'Never';
        statusText = typeof dbMatch.config?.last_message === 'string' ? dbMatch.config.last_message : undefined;
        progress = typeof dbMatch.config?.sync_progress === 'number' ? dbMatch.config.sync_progress : undefined;
      }

      if (status === 'pending_approval' && !statusText) {
        statusText = 'Approve access in your ad platform, then reconnect to verify.';
      }

      if (status === 'syncing' && !statusText) {
        statusText = 'Initial sync is in progress.';
      }

      if (csvMatch && !dbMatch) {
        sourceHint = 'Detected in imported CSV';
      }

      return {
        ...def,
        status,
        id,
        lastSynced,
        statusText,
        sourceHint,
        progress,
      };
    }).filter(item => {
      const matchesTab = activeTab === 'All Sources' || item.type === activeTab;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [integrationDefinitions, dbIntegrations, csvConnectedChannels, activeTab, searchQuery]);

  const handleAddConnection = () => {
    const nextPlatform = integrationDefinitions.find(def => {
      const dbMatch = dbIntegrations.find(i => i.platform_id === def.platformId);
      return !dbMatch || dbMatch.status === 'available' || dbMatch.status === 'error';
    }) || integrationDefinitions[0];

    setSelectedPlatform({ id: nextPlatform.platformId, name: nextPlatform.name, icon: nextPlatform.icon });
  };

  const handleResync = async (platformId: string) => {
    const dbMatch = dbIntegrations.find(i => i.platform_id === platformId);
    if (!dbMatch) return;
    
    // For direct re-sync button click, let's open the settings modal
    setEditingIntegration(dbMatch);
  };

  const handleDirectResync = async (platformId: string) => {
    const dbMatch = dbIntegrations.find(i => i.platform_id === platformId);
    if (!dbMatch) return;
    
    // Set status to syncing optimistically
    const updated = { ...dbMatch, status: 'syncing' as const };
    useDataStore.setState(prev => ({
       integrations: prev.integrations.map(i => i.id === dbMatch.id ? updated : i)
    }));

    try {
      const config = dbMatch.config as Record<string, string>;
      const validationResult = await integrationApi.testConnection(dbMatch.platform_id, config);
      
      await addIntegration({
        platform_id: dbMatch.platform_id,
        status: validationResult.result === 'connected' ? 'connected' : 'pending_approval',
        account_name: validationResult.accountName || dbMatch.account_name,
        account_id: validationResult.externalAccountId || dbMatch.account_id || 'Unknown',
        config: {
          ...config,
          last_result: validationResult.result,
          last_message: validationResult.message,
          details: validationResult.details || {},
        },
        last_synced_at: validationResult.result === 'connected' ? new Date().toISOString() : null,
      });
      toast.success('Sync retried successfully.');
      fetchIntegrations();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Failed to retry sync.');
      fetchIntegrations();
    }
  };

  return (
    <div className="px-8 pt-8 space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <nav className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-widest">
            <span>Data</span>
            <ChevronRight size={12} />
            <span className="text-brand-primary">Integrations</span>
          </nav>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Data Integrations</h1>
          <p className="text-slate-500 max-w-2xl leading-relaxed">
            Manage and monitor your marketing data sources for Marketing Mix Modeling. 
            Connect new platforms to enrich your analytics.
          </p>
        </div>
        <button
          onClick={handleAddConnection}
          className="flex items-center gap-2 px-6 py-4 bg-brand-primary text-white rounded-2xl text-sm font-bold shadow-lg shadow-red-200/50 hover:bg-brand-primary/90 transition-all active:scale-95"
        >
          <Plus size={20} />
          Add New Connection
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white/50 p-2 rounded-2xl border border-slate-100/50 backdrop-blur-sm">
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto p-1">
          {['All Sources', 'Paid Media', 'CRM & Sales', 'Organic Social'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all",
                activeTab === tab 
                   ? "bg-brand-secondary/10 text-brand-secondary shadow-sm" 
                   : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
           <div className="relative flex-1 md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text"
                placeholder="Filter integrations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all font-medium"
              />
           </div>
           <button className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-600 transition-colors">
              <Filter size={18} />
           </button>
           <button className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-600 transition-colors">
              <LayoutGrid size={18} />
           </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {mergedIntegrations.map((item, idx) => (
          <IntegrationCard 
            key={idx}
            {...item}
            onConnect={() => setSelectedPlatform({ id: item.platformId, name: item.name, icon: item.icon })}
            onEditSettings={() => setEditingIntegration(dbIntegrations.find(i => i.platform_id === item.platformId) || null)}
            onResync={() => handleResync(item.platformId)}
            onRetrySync={() => handleDirectResync(item.platformId)}
            onViewDetails={() => {
              const dbMatch = dbIntegrations.find(i => i.platform_id === item.platformId);
              if (dbMatch) setViewingSyncId(dbMatch.id);
            }}
          />
        ))}
      </div>

      {/* Integration Wizard Modal */}
      {selectedPlatform && (
        <IntegrationWizard 
          platform={selectedPlatform}
          onClose={() => setSelectedPlatform(null)}
          onSuccess={() => fetchIntegrations()}
        />
      )}

      {/* Integration Settings Modal */}
      {editingIntegration && (
        <IntegrationSettingsModal
          integration={editingIntegration}
          onClose={() => setEditingIntegration(null)}
        />
      )}

      {viewingSyncId && (
        <SyncDetailsModal
          integrationId={viewingSyncId}
          onClose={() => setViewingSyncId(null)}
        />
      )}
    </div>
  );
};
