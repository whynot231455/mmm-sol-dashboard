import { useState, useMemo } from 'react';
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
import { useDataStore } from '../store/useDataStore';
import { IntegrationCard, type IntegrationStatus } from '../components/IntegrationCard';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const ConnectPage = () => {
  const { rawData, mapping } = useDataStore();
  const [activeTab, setActiveTab] = useState('All Sources');
  const [searchQuery, setSearchQuery] = useState('');

  // Detect connected channels from CSV
  const connectedChannels = useMemo(() => {
    if (!rawData.length || !mapping.channel) return new Set<string>();
    const channels = rawData.map(row => String(row[mapping.channel!] || '').toLowerCase());
    return new Set(channels);
  }, [rawData, mapping.channel]);

  const integrations = [
    {
      name: 'Google Ads',
      type: 'Paid Media',
      icon: <Megaphone className="text-blue-500" />,
      id: '882-129-3301',
      lastSynced: '2m ago',
      matchNames: ['google ads', 'adwords', 'search ads']
    },
    {
      name: 'Meta Ads',
      type: 'Paid Media',
      icon: <div className="text-blue-600 font-bold text-lg italic">f</div>,
      id: '1029384756',
      status: 'syncing' as IntegrationStatus,
      progress: 45,
      matchNames: ['meta ads', 'facebook ads', 'instagram ads', 'facebook']
    },
    {
      name: 'LinkedIn Ads',
      type: 'Paid Media',
      icon: <div className="bg-blue-700 text-white p-1 rounded-sm"><Link2 size={12} /></div>,
      status: 'error' as IntegrationStatus,
      statusText: 'Auth token expired',
      matchNames: ['linkedin ads', 'linkedin']
    },
    {
      name: 'Salesforce',
      type: 'CRM & Sales',
      icon: <Database className="text-blue-400" />,
      id: 'Org: Sol-Analytics-Prod',
      lastSynced: '1h ago',
      matchNames: ['salesforce', 'crm']
    },
    {
      name: 'TikTok Ads',
      type: 'Paid Media',
      icon: <MonitorPlay className="text-black" />,
      matchNames: ['tiktok ads', 'tiktok']
    },
    {
      name: 'HubSpot',
      type: 'CRM & Sales',
      icon: <UserCheck className="text-orange-500" />,
      statusText: 'Import CRM contacts & deals',
      matchNames: ['hubspot']
    },
    {
      name: 'Shopify',
      type: 'E-commerce',
      icon: <Package className="text-green-600" />,
      statusText: 'Sync sales & product data',
      matchNames: ['shopify']
    },
    {
      name: 'Twitter / X Ads',
      type: 'Paid Media',
      icon: <Globe className="text-slate-800" />,
      matchNames: ['twitter ads', 'x ads', 'twitter']
    }
  ];

  const filteredIntegrations = integrations.filter(item => {
    const matchesTab = activeTab === 'All Sources' || item.type === activeTab;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
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
        <button className="flex items-center gap-2 px-6 py-4 bg-brand-primary text-white rounded-2xl text-sm font-bold shadow-lg shadow-red-200/50 hover:bg-brand-primary/90 transition-all active:scale-95">
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
        {filteredIntegrations.map((item, idx) => {
          // Determine status dynamically
          let status: IntegrationStatus = item.status || 'available';
          
          if (!item.status) {
              const matches = item.matchNames.some(name => connectedChannels.has(name));
              if (matches) status = 'connected';
          }

          return (
            <IntegrationCard 
              key={idx}
              {...item}
              status={status}
            />
          );
        })}
      </div>
    </div>
  );
};
