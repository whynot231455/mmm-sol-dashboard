import { useState, useMemo } from 'react';
import { Search, Filter, LayoutGrid, ChevronRight, MonitorPlay, Globe, Database, Link2, Megaphone, UserCheck, Package } from 'lucide-react';
import { useDataStore } from '../store/useDataStore';
import { ConnectionWizard } from '../components/ConnectionWizard';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type IntegrationStatus = 'available' | 'connected' | 'syncing' | 'error' | 'pending_approval';

const IntegrationCard = ({ name, type, icon, status, onConnect }: {
  name: string;
  type: string;
  icon: React.ReactNode;
  status: IntegrationStatus;
  onConnect: () => void;
}) => {
  const statusStyles: Record<string, string> = {
    connected: 'bg-green-50 text-green-700 border-green-200',
    available: 'bg-white text-slate-600 border-slate-200 hover:border-brand-primary/30',
    syncing: 'bg-amber-50 text-amber-700 border-amber-200',
    error: 'bg-red-50 text-red-700 border-red-200',
    pending_approval: 'bg-blue-50 text-blue-700 border-blue-200',
  };

  return (
    <div className={cn('rounded-2xl border p-5 transition-all shadow-sm', statusStyles[status] || statusStyles.available)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm">
            {icon}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">{name}</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{type}</p>
          </div>
        </div>
        <div className={cn(
          'px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider',
          status === 'connected' ? 'bg-green-100 text-green-700' :
          status === 'syncing' ? 'bg-amber-100 text-amber-700' :
          status === 'error' ? 'bg-red-100 text-red-700' :
          'bg-slate-100 text-slate-500'
        )}>
          {status}
        </div>
      </div>
      <button
        onClick={onConnect}
        className={cn(
          'w-full py-2 rounded-xl text-xs font-bold transition-all',
          status === 'connected'
            ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            : 'bg-brand-primary text-white hover:bg-brand-primary/90 shadow-sm'
        )}
      >
        {status === 'connected' ? 'Manage' : 'Connect'}
      </button>
    </div>
  );
};

export const ConnectPage = () => {
  const { rawData, mapping, setNotification, updateIntegration } = useDataStore();
  const [activeTab, setActiveTab] = useState('All Sources');
  const [searchQuery, setSearchQuery] = useState('');
  const [integrationStatuses, setIntegrationStatuses] = useState<Record<string, IntegrationStatus>>({
    google_ads: 'connected',
    meta_ads: 'connected',
    linkedin_ads: 'available',
    salesforce: 'available',
    tiktok_ads: 'syncing',
    hubspot: 'available',
    shopify: 'connected',
    twitter_ads: 'available',
  });

  const csvConnectedChannels = useMemo(() => {
    if (!rawData.length || !mapping.channel) return new Set<string>();
    const channels = rawData.map(row => String(row[mapping.channel!] || '').toLowerCase());
    return new Set(channels);
  }, [rawData, mapping.channel]);

  const integrationDefinitions = useMemo(() => [
    { platformId: 'google_ads', name: 'Google Ads', type: 'Paid Media', icon: <Megaphone className="text-blue-500" />, matchNames: ['google ads', 'adwords', 'search ads'] },
    { platformId: 'meta_ads', name: 'Meta Ads', type: 'Paid Media', icon: <div className="text-blue-600 font-bold text-lg italic">f</div>, matchNames: ['meta ads', 'facebook ads', 'instagram ads', 'facebook'] },
    { platformId: 'linkedin_ads', name: 'LinkedIn Ads', type: 'Paid Media', icon: <div className="bg-blue-700 text-white p-1 rounded-sm"><Link2 size={12} /></div>, matchNames: ['linkedin ads', 'linkedin'] },
    { platformId: 'salesforce', name: 'Salesforce', type: 'CRM & Sales', icon: <Database className="text-blue-400" />, matchNames: ['salesforce', 'crm'] },
    { platformId: 'tiktok_ads', name: 'TikTok Ads', type: 'Paid Media', icon: <MonitorPlay className="text-black" />, matchNames: ['tiktok ads', 'tiktok'] },
    { platformId: 'hubspot', name: 'HubSpot', type: 'CRM & Sales', icon: <UserCheck className="text-orange-500" />, matchNames: ['hubspot'] },
    { platformId: 'shopify', name: 'Shopify', type: 'E-commerce', icon: <Package className="text-green-600" />, matchNames: ['shopify'] },
    { platformId: 'twitter_ads', name: 'Twitter / X Ads', type: 'Paid Media', icon: <Globe className="text-slate-800" />, matchNames: ['twitter ads', 'x ads', 'twitter'] },
  ], []);

  const [selectedPlatform, setSelectedPlatform] = useState<{ id: string; name: string; icon: React.ReactNode } | null>(null);
  const [wizardMode, setWizardMode] = useState<'connect' | 'manage'>('connect');

  const mergedIntegrations = useMemo(() => {
    return integrationDefinitions.map(def => {
      const status = integrationStatuses[def.platformId] || 'available';
      const csvMatch = def.matchNames.some(name => csvConnectedChannels.has(name));
      return {
        ...def,
        status,
        sourceHint: csvMatch ? 'Detected in imported CSV' : undefined,
      };
    }).filter(item => {
      const matchesTab = activeTab === 'All Sources' || item.type === activeTab;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [integrationDefinitions, integrationStatuses, csvConnectedChannels, activeTab, searchQuery]);

  const handleConnect = (platform: { platformId: string; name: string; icon: React.ReactNode }) => {
    const isConnected = integrationStatuses[platform.platformId] === 'connected';
    setWizardMode(isConnected ? 'manage' : 'connect');
    setSelectedPlatform({
      id: platform.platformId,
      name: platform.name,
      icon: platform.icon
    });
  };

  const handleConnectionSuccess = (platformId: string) => {
    // 1. Update the connection status to 'syncing' initially to simulate real ingestion
    setIntegrationStatuses(prev => ({
      ...prev,
      [platformId]: 'syncing'
    }));

    // 2. Trigger a global notification
    const platform = integrationDefinitions.find(d => d.platformId === platformId);
    setNotification({
      id: Date.now().toString(),
      type: 'success',
      message: `Successfully connected to ${platform?.name || platformId}! Initial data ingestion started.`,
      actionLabel: 'View Performance',
      targetPage: 'measure'
    });

    // 3. Simulate ingestion completion after 8 seconds
    setTimeout(() => {
      setIntegrationStatuses(prev => ({
        ...prev,
        [platformId]: 'connected'
      }));
      
      // Update store with realistic row counts for integrated data
      updateIntegration(platformId, {
        syncStatus: 'HEALTHY',
        lastSyncAt: new Date().toISOString(),
        rowCount: Math.floor(Math.random() * 5000) + 1000,
        ingestionProgress: 100
      });
    }, 8000);
  };

  const handleDisconnect = (platformId: string) => {
    setIntegrationStatuses(prev => {
      const next = { ...prev };
      delete next[platformId];
      return next;
    });
  };

  return (
    <div className="px-8 pt-8 space-y-8 pb-12">
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
      </div>

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {mergedIntegrations.map((item, idx) => (
          <IntegrationCard 
            key={idx}
            name={item.name}
            type={item.type}
            icon={item.icon}
            status={item.status as IntegrationStatus}
            onConnect={() => handleConnect(item)}
          />
        ))}
      </div>

      <ConnectionWizard 
        platform={selectedPlatform}
        mode={wizardMode}
        onClose={() => setSelectedPlatform(null)}
        onSuccess={handleConnectionSuccess}
        onDisconnect={handleDisconnect}
      />
    </div>
  );
};
