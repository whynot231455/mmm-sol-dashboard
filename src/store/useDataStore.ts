import { create } from 'zustand';

export type PageType =
    | 'login' | 'signup' | 'measure' | 'predict' | 'optimize' | 'chat'
    | 'import' | 'connect' | 'transform' | 'dss-test'
    | 'train' | 'validate' | 'calibrate' | 'geolift' | 'pipelines'
    | 'video-tutorials' | 'documentation' | 'success';

interface ColumnMapping {
    date?: string;
    revenue?: string;
    spend?: string;
    channel?: string;
    country?: string;
    [key: string]: string | undefined;
}

export type SyncStatus = 'IDLE' | 'SYNCING' | 'HEALTHY' | 'ERROR';

export interface IntegrationMetadata {
    platformId: string;
    lastSyncAt: string | null;
    syncStatus: SyncStatus;
    ingestionProgress: number;
    rowCount: number;
}

export interface AppNotification {
    id: string;
    type: 'success' | 'info' | 'warning';
    message: string;
    actionLabel?: string;
    targetPage?: PageType;
}

interface Filters {
    country: string;
    channel: string;
    dateRange: string;
}

export interface Tutorial {
    id: string;
    title: string;
    description: string;
    videoUrl: string;
    category: string;
    duration: number;
    views?: number;
    thumbnail?: string;
    status?: 'draft' | 'published' | 'archived' | 'Not Started' | 'In Progress' | 'Completed';
    progress?: number;
    split?: number;
}

export interface DocumentationSection {
    id: string;
    title: string;
    articles: {
        id?: string;
        title: string;
        content: string;
        tags: string[];
        abstract?: string;
        lastUpdated?: string;
        readingTime?: number;
        onPageLinks?: { id: string; title: string }[];
    }[];
}

export interface TransformSettings {
    normalization: string;
    outlierHandling: string;
    missingValueStrategy: string;
    dataSource: string;
    dateRange: { start: string; end: string };
    primaryMetric: 'spend' | 'impressions' | 'clicks';
    adstock: {
        active: boolean;
        lag: number;
        decayRate: number;
    };
    saturation: {
        active: boolean;
        curveType: 'hill' | 's-curve' | 'power';
        slope: number;
        inflection: number;
        gamma: number;
    };
    controlVariables: {
        promotions: {
            active: boolean;
            sensitivity: 'low' | 'medium' | 'high';
        };
        holidays: {
            active: boolean;
            country: string;
        };
    };
    metrics: {
        r2: number;
        vif: number;
        mape: number;
    };
}

interface DataState {
    rawData: Record<string, unknown>[];
    headers: string[];
    mapping: ColumnMapping;
    filters: Filters;
    isLoaded: boolean;
    activePage: PageType;
    channelColors: Record<string, string>;
    isProcessing: boolean;
    hasHydrated: boolean;
    tutorials: Tutorial[];
    documentation: DocumentationSection[];
    transformSettings: TransformSettings;
    integratedData: Record<string, unknown>[];
    integrations: Record<string, IntegrationMetadata>;
    notification: AppNotification | null;
    dataSourceView: 'legacy' | 'integrated';

    setData: (data: Record<string, unknown>[], headers: string[]) => void;
    setIntegratedData: (data: Record<string, unknown>[]) => void;
    updateIntegration: (platformId: string, metadata: Partial<IntegrationMetadata>) => void;
    setNotification: (notification: AppNotification | null) => void;
    setDataSourceView: (view: 'legacy' | 'integrated') => void;
    setMapping: (mapping: ColumnMapping) => void;
    setFilter: (key: keyof Filters, value: string) => void;
    setActivePage: (page: PageType) => void;
    setChannelColor: (channel: string, color: string) => void;
    setIsProcessing: (isProcessing: boolean) => void;
    setHasHydrated: (hasHydrated: boolean) => void;
    addTutorial: (tutorial: Omit<Tutorial, 'id'>) => void;
    deleteTutorial: (id: string) => void;
    setTransformSettings: (settings: Partial<TransformSettings>) => void;
    reset: () => void;
}

const DEMO_DATA: Record<string, unknown>[] = (() => {
  const channels = ['Meta Ads', 'Google Search', 'Instagram', 'YouTube', 'TikTok'];
  const countries = ['USA', 'UK', 'Germany'];
  const data: Record<string, unknown>[] = [];
  const startDate = new Date('2023-01-01');
  for (let i = 0; i < 365; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    channels.forEach((ch) => {
      countries.forEach((ct) => {
        // Daily data needs more fluctuation
        const dayOfWeek = d.getDay();
        const weekendBoost = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.4 : 1.0;
        const seasonal = 1 + Math.sin(i / 20) * 0.2;
        
        const base = (Math.random() * 1000 + 500) * weekendBoost * seasonal;
        const spend = Math.round(base);
        const revenue = Math.round(spend * (3.0 + Math.random() * 2.5));
        
        data.push({
          Date: dateStr,
          Channel: ch,
          Country: ct,
          Spend: spend,
          Revenue: revenue,
          Impressions: Math.round(spend * 150),
          Clicks: Math.round(spend * 4.2),
        });
      });
    });
  }
  return data;
})();

const DEMO_HEADERS = ['Date', 'Channel', 'Country', 'Spend', 'Revenue', 'Impressions', 'Clicks'];

const DEMO_MAPPING: ColumnMapping = {
  date: 'Date',
  revenue: 'Revenue',
  spend: 'Spend',
  channel: 'Channel',
  country: 'Country',
};

const DEMO_TUTORIALS: Tutorial[] = [
    {
        id: '1',
        title: 'Introduction to MMM Fundamentals',
        description: 'Understand the core mathematical concepts behind modern Marketing Mix Modeling.',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        category: 'Module 1: Foundations',
        duration: 450,
        views: 2400,
        thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800',
        status: 'Completed',
        progress: 100,
        split: 1,
    },
    {
        id: '2',
        title: 'Data Preparation & Ingestion',
        description: 'Learn how to clean and structure your marketing data for accurate model training.',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        category: 'Module 1: Foundations',
        duration: 820,
        views: 1800,
        thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800',
        status: 'Completed',
        progress: 100,
        split: 1,
    },
    {
        id: '3',
        title: 'Channel-Level Saturation Curves',
        description: 'Master the art of calculating diminishing returns for each ad platform.',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        category: 'Module 2: Advanced Modeling',
        duration: 1200,
        views: 1200,
        thumbnail: 'https://images.unsplash.com/photo-1543286386-713bdd548da4?auto=format&fit=crop&q=80&w=800',
        status: 'In Progress',
        progress: 45,
        split: 1,
    },
    {
        id: '4',
        title: 'Bayesian Inference in MMM',
        description: 'Deep dive into probability theory and how it stabilizes model coefficients.',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        category: 'Module 2: Advanced Modeling',
        duration: 1560,
        views: 950,
        thumbnail: '/bayesian_inference_thumbnail.png',
        status: 'Not Started',
        progress: 0,
        split: 1,
    },
    {
        id: '5',
        title: 'Budget Optimization Strategies',
        description: 'Using your model outputs to reallocate budget across channels for maximum ROI.',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        category: 'Module 3: Strategic Planning',
        duration: 940,
        views: 3100,
        thumbnail: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?auto=format&fit=crop&q=80&w=800',
        status: 'Not Started',
        progress: 0,
        split: 1,
    },
    {
        id: '6',
        title: 'Incrementality & Lift Testing',
        description: 'Bridge the gap between observation and experimentation with lift tests.',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        category: 'Module 3: Strategic Planning',
        duration: 1100,
        views: 1500,
        thumbnail: 'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&q=80&w=800',
        status: 'Not Started',
        progress: 0,
        split: 1,
    },
];

const DEMO_INTEGRATED_DATA: Record<string, unknown>[] = (() => {
  const platforms = ['Meta Ads', 'Google Ads', 'Shopify'];
  const countries = ['USA', 'UK', 'Germany'];
  const data: Record<string, unknown>[] = [];
  const startDate = new Date('2023-01-01');
  for (let i = 0; i < 365; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    platforms.forEach((p) => {
      countries.forEach((ct) => {
        const spend = Math.round(Math.random() * 2000 + 1000);
        const revenue = Math.round(spend * (4.0 + Math.random() * 3.0));
        data.push({
          Date: dateStr,
          Channel: p,
          Country: ct,
          Spend: spend,
          Revenue: revenue
        });
      });
    });
  }
  return data;
})();

const DEMO_DOCUMENTATION: DocumentationSection[] = [
    {
        id: '1',
        title: 'Getting Started',
        articles: [
            { id: '1', title: 'Introduction', content: 'Welcome to MMM', tags: ['intro', 'basics'], abstract: 'Introduction to MMM', lastUpdated: '2024-01-01', readingTime: 5, onPageLinks: [] },
            { id: '2', title: 'Data Import', content: 'How to import your data', tags: ['data', 'import'], abstract: 'Data import guide', lastUpdated: '2024-01-02', readingTime: 10, onPageLinks: [] },
        ],
    },
];

const DEMO_TRANSFORM_SETTINGS: TransformSettings = {
    normalization: 'minmax',
    outlierHandling: 'clip',
    missingValueStrategy: 'mean',
    dataSource: 'All Sources',
    dateRange: { start: '', end: '' },
    primaryMetric: 'spend',
    adstock: {
        active: true,
        lag: 1,
        decayRate: 0.65,
    },
    saturation: {
        active: true,
        curveType: 'hill',
        slope: 1.42,
        inflection: 0.5,
        gamma: 50000,
    },
    controlVariables: {
        promotions: {
            active: true,
            sensitivity: 'medium',
        },
        holidays: {
            active: true,
            country: 'USA',
        },
    },
    metrics: {
        r2: 0.89,
        vif: 1.2,
        mape: 0.12,
    },
};

export const useDataStore = create<DataState>()((set) => ({
    rawData: DEMO_DATA,
    headers: DEMO_HEADERS,
    mapping: DEMO_MAPPING,
    filters: {
        country: 'All',
        channel: 'All',
        dateRange: 'Last 30 Days'
    },
    isLoaded: true,
    activePage: 'login',
    channelColors: {
        'Base': '#64748b',
        'Meta Ads': '#1877F2',
        'Google Search': '#4285F4',
        'Instagram': '#E4405F',
        'YouTube': '#FF0000',
        'TikTok': '#000000',
        'LinkedIn': '#0A66C2',
        'Pinterest': '#E60023',
        'Twitter': '#1DA1F2',
        'Snapchat': '#FFFC00',
        'Bing': '#00809D',
        'Criteo': '#FF6000',
        'Adtraction': '#FF4500',
    },
    isProcessing: false,
    hasHydrated: true,
    tutorials: DEMO_TUTORIALS,
    documentation: DEMO_DOCUMENTATION,
    transformSettings: DEMO_TRANSFORM_SETTINGS,
    integratedData: DEMO_INTEGRATED_DATA,
    integrations: {
        google_ads: { platformId: 'google_ads', lastSyncAt: '2024-05-01T10:00:00Z', syncStatus: 'HEALTHY', ingestionProgress: 100, rowCount: 1240 },
        meta_ads: { platformId: 'meta_ads', lastSyncAt: '2024-05-02T14:30:00Z', syncStatus: 'HEALTHY', ingestionProgress: 100, rowCount: 850 },
        shopify: { platformId: 'shopify', lastSyncAt: '2024-05-02T15:00:00Z', syncStatus: 'HEALTHY', ingestionProgress: 100, rowCount: 3400 },
        tiktok_ads: { platformId: 'tiktok_ads', lastSyncAt: null, syncStatus: 'IDLE', ingestionProgress: 0, rowCount: 0 },
    },
    notification: null,
    dataSourceView: 'legacy',

    setData: (data, headers) => set((state) => {
        const newMapping = { ...state.mapping };
        for (const key in newMapping) {
            if (newMapping[key] && !headers.includes(newMapping[key] as string)) {
                delete newMapping[key];
            }
        }
        return {
            rawData: data,
            headers: headers,
            mapping: newMapping,
            isLoaded: data.length > 0
        };
    }),

    setIntegratedData: (data) => set({ integratedData: data }),

    updateIntegration: (platformId, metadata) => set((state) => ({
        integrations: {
            ...state.integrations,
            [platformId]: { ...state.integrations[platformId], ...metadata }
        }
    })),

    setNotification: (notification) => set({ notification }),

    setDataSourceView: (view) => set({ dataSourceView: view }),

    setMapping: (mapping) => set({ mapping }),

    setFilter: (key, value) => set((state) => ({
        filters: { ...state.filters, [key]: value }
    })),

    setActivePage: (page) => set({ activePage: page }),

    setChannelColor: (channel: string, color: string) => set((state) => ({
        channelColors: { ...state.channelColors, [channel]: color }
    })),

    setIsProcessing: (isProcessing) => set({ isProcessing }),
    setHasHydrated: (hasHydrated) => set({ hasHydrated }),

    addTutorial: (tutorial) => set((state) => ({
        tutorials: [...state.tutorials, { ...tutorial, id: Date.now().toString() }]
    })),

    deleteTutorial: (id) => set((state) => ({
        tutorials: state.tutorials.filter(t => t.id !== id)
    })),

    setTransformSettings: (settings) => set((state) => ({
        transformSettings: { ...state.transformSettings, ...settings }
    })),

    reset: () => set({
        rawData: [],
        headers: [],
        mapping: {},
        filters: {
            country: 'All',
            channel: 'All',
            dateRange: 'Last 30 Days'
        },
        isLoaded: false,
        activePage: 'login',
        isProcessing: false,
    }),
}));
