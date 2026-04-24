import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { StateStorage } from 'zustand/middleware';
import { get, set as idbSet, del } from 'idb-keyval';
import { supabase } from '../lib/supabase';
import type { IntegrationStatus } from '../components/IntegrationCard';
import { toast } from 'sonner';

// Custom storage for Zustand persistence using IndexedDB (via idb-keyval)
// This enables storing large datasets that exceed localStorage's ~5MB limit.
const storage: StateStorage = {
    getItem: async (name: string): Promise<string | null> => {
        try {
            return (await get(name)) || null;
        } catch (error) {
            console.error('IndexedDB getItem error:', error);
            return null;
        }
    },
    setItem: async (name: string, value: string): Promise<void> => {
        try {
            await idbSet(name, value);
        } catch (error) {
            console.error('IndexedDB setItem error:', error);
        }
    },
    removeItem: async (name: string): Promise<void> => {
        try {
            await del(name);
        } catch (error) {
            console.error('IndexedDB removeItem error:', error);
        }
    },
};

let pollingInterval: number | null = null;

interface ColumnMapping {
    date?: string;
    revenue?: string;
    spend?: string;
    channel?: string;
    country?: string;
    [key: string]: string | undefined;
}

export type PageType =
    | 'login' | 'signup' | 'measure' | 'predict' | 'optimize' | 'chat'
    | 'import' | 'connect' | 'transform' | 'dss-test'
    | 'train' | 'validate' | 'calibrate' | 'geolift' | 'pipelines'
    | 'video-tutorials' | 'documentation' | 'success';


interface Filters {
    country: string;
    channel: string;
    dateRange: string;
}

export interface DocArticle {
    id: string;
    title: string;
    readingTime: string;
    tags: string[];
    lastUpdated: string;
    abstract: string;
    content: string; // HTML string or Markdown
    onPageLinks: { title: string; id: string }[];
}

export interface DocSection {
    id: string;
    title: string;
    articles: DocArticle[];
}

export interface Tutorial {
    id: string;
    title: string;
    duration: string;
    thumbnail: string;
    type: 'youtube' | 'upload';
    status: 'Not Started' | 'In Progress' | 'Completed';
    description: string;
    progress: number;
    videoUrl?: string;
    views?: string;
}

export interface TransformSettings {
    primaryMetric: 'spend' | 'impressions' | 'clicks';
    aggregation: {
        granularity: 'daily' | 'weekly' | 'monthly';
        method: 'sum' | 'avg' | 'max';
        weekStarting: 'monday' | 'sunday';
    };
    adstock: {
        type: 'geometric';
        decayRate: number;
        lag: number;
    };
    saturation: {
        active: boolean;
        curveType: 'hill' | 's-curve' | 'power';
        slope: number;
        inflection: number;
        gamma?: number;
    };
    metrics: {
        r2: number;
        vif: number;
        rss: string;
    };
    dateRange: {
        start: string;
        end: string;
    };
    currency: string;
    dataSource: string;
    controlVariables: {
        baseMetrics: {
            priceVariable: string;
            volumeVariable: string;
        };
        promotions: {
            enabled: boolean;
            sensitivity: 'low' | 'high' | 'medium';
        };
        timeEffects: {
            priceChangeLag: number;
        };
    };
}

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    attachments?: ChatAttachment[];
}

export interface ChatAttachment {
    id: string;
    name: string;
    type: 'image';
    mimeType: 'image/png' | 'image/jpeg';
    dataUrl?: string;
}

export interface ChatSession {
    id: string;
    title: string;
    messages: Message[];
    lastUpdated: number;
}

export interface Integration {
    id: string;
    platform_id: string;
    status: IntegrationStatus;
    account_name: string;
    account_id: string;
    config: Record<string, unknown>;
    last_synced_at: string | null;
    created_at?: string;
}

export interface AdPerformanceRecord {
    date: string;
    campaign_name: string;
    spend: string;
    impressions?: number;
    clicks?: number;
    created_at?: string;
}

interface DataState {
    rawData: Record<string, unknown>[];
    headers: string[];
    mapping: ColumnMapping;
    filters: Filters;
    documentation: DocSection[];
    transformSettings: TransformSettings;
    isLoaded: boolean;
    activePage: PageType;
    tutorials: Tutorial[];
    channelColors: Record<string, string>;
    chatSessions: ChatSession[];
    activeChatSessionId: string | null;
    isProcessing: boolean;
    hasHydrated: boolean;

    integrations: Integration[];
    recentSyncRecords: AdPerformanceRecord[];
    
    // Actions
    setData: (data: Record<string, unknown>[], headers: string[]) => void;
    setMapping: (mapping: ColumnMapping) => void;
    setFilter: (key: keyof Filters, value: string) => void;
    setTransformSettings: (settings: Partial<TransformSettings>) => void;
    setActivePage: (page: PageType) => void;
    addTutorial: (tutorial: Tutorial) => void;
    deleteTutorial: (id: string) => void;
    updateTutorialProgress: (id: string, progress: number) => void;
    setChannelColor: (channel: string, color: string) => void;
    setChatSessions: (sessions: ChatSession[] | ((prev: ChatSession[]) => ChatSession[])) => void;
    setActiveChatSessionId: (id: string | null) => void;
    setIsProcessing: (isProcessing: boolean) => void;
    setHasHydrated: (hasHydrated: boolean) => void;
    setIntegrations: (integrations: Integration[]) => void;
    fetchIntegrations: () => Promise<void>;
    addIntegration: (integration: Omit<Integration, 'id' | 'created_at'>) => Promise<void>;
    removeIntegration: (id: string) => Promise<void>;
    startPollingIntegrations: () => void;
    stopPollingIntegrations: () => void;
    fetchRecentSyncRecords: (integrationId: string) => Promise<void>;

    addMessageToSession: (sessionId: string, message: Message) => void;
    updateMessageInSession: (sessionId: string, messageId: string, content: string) => void;
    updateChatSession: (sessionId: string, updates: Partial<ChatSession>) => void;
    deleteChatSession: (id: string) => void;
    removeChatSessionLocally: (id: string) => void;
    clearChatSessions: () => void;
    reset: () => void;
}

const stripAttachmentData = (attachment: ChatAttachment): ChatAttachment => ({
    id: attachment.id,
    name: attachment.name,
    type: attachment.type,
    mimeType: attachment.mimeType,
});

const stripSessionAttachmentData = (session: ChatSession): ChatSession => ({
    ...session,
    messages: session.messages.map((message) => ({
        ...message,
        attachments: message.attachments?.map(stripAttachmentData) ?? [],
    })),
});

const syncSessionMetadata = (session: ChatSession) => {
    void supabase.from('chat_sessions').upsert({
        id: session.id,
        title: session.title,
        last_updated: new Date(session.lastUpdated).toISOString()
    }, { onConflict: 'id' }).then(({ error }) => {
        if (error) {
            console.error('Failed to sync session', error);
            toast.error('Failed to sync chat session.');
        }
    });
};

const syncSessionMessage = (sessionId: string, message: Message) => {
    void supabase.from('chat_messages').upsert({
        id: message.id,
        session_id: sessionId,
        role: message.role,
        content: message.content,
    }, { onConflict: 'id' }).then(({ error }) => {
        if (error) {
            console.error('Failed to sync chat message', error);
            toast.error('Failed to sync chat message.');
        }
    });
};

const initialDocumentation: DocSection[] = [
    {
        id: '1',
        title: 'Fundamentals of MMM',
        articles: [
            {
                id: 'understanding-mmm',
                title: 'Understanding Marketing Mix Modeling',
                readingTime: '5 min read',
                tags: ['Core Concepts'],
                lastUpdated: 'Oct 24, 2023',
                abstract: 'A comprehensive guide to how Sol Analytics uses statistical analysis to estimate the impact of various marketing tactics on sales and then forecast the impact of future sets of tactics.',
                content: `
                    <p>Marketing Mix Modeling (MMM) is a statistical analysis technique used to estimate the impact of various marketing tactics on sales and then forecast the impact of future sets of tactics. It is often used to optimize the advertising mix and promotional tactics with respect to sales revenue or profit.</p>
                    <h2 id="key-components">Key Components</h2>
                    <p>Effective MMM relies on decomposing sales volume into two primary sources:</p>
                    <ul>
                        <li><strong>Base Sales:</strong> Sales that occur naturally without any advertising stimulation. This is driven by brand equity, seasonality, and distribution.</li>
                        <li><strong>Incremental Sales:</strong> Sales driven by marketing activities like TV ads, digital campaigns, and promotions.</li>
                    </ul>
                `,
                onPageLinks: [
                    { title: 'Key Components', id: 'key-components' },
                    { title: 'Adstock Theory', id: 'adstock' },
                    { title: 'Diminishing Returns', id: 'returns' }
                ]
            }
        ]
    },
    {
        id: '2',
        title: 'About Sol Analytics',
        articles: [
            {
                id: 'company-overview',
                title: 'Paving the Way for Insights & Intelligence',
                readingTime: '3 min read',
                tags: ['Company', 'Identity'],
                lastUpdated: 'Dec 2025',
                abstract: 'Learn about Sol Analytics, a leading consulting company focused on Research, Marketing Analytics, and Digital Transformation.',
                content: `
                    <p>Sol Analytics is a premier consulting firm dedicated to empowering organizations through data-driven decision-making. We focus on three core pillars: <strong>Insights, Intelligence, and Infrastructure</strong>.</p>
                    <h2 id="core-pillars">Core Pillars</h2>
                    <ul>
                        <li><strong>Insights:</strong> Building a Single Version of Truth (SVOT) to enable confident, fact-based choices.</li>
                        <li><strong>Intelligence:</strong> Leveraging Predictive and Prescriptive Analytics for strategic foresight and agility.</li>
                        <li><strong>Infrastructure:</strong> Establishing robust data platforms, warehouses, and cloud migration services.</li>
                    </ul>
                    <h2 id="our-expertise">Our Expertise</h2>
                    <p>We combine deep knowledge in Consulting, Technology, and Data Science to uncover hidden facts and unlock boundless possibilities for business growth.</p>
                `,
                onPageLinks: [
                    { title: 'Core Pillars', id: 'core-pillars' },
                    { title: 'Expertise', id: 'our-expertise' }
                ]
            }
        ]
    }
];

export const useDataStore = create<DataState>()(
    persist(
        (set) => ({
            rawData: [],
            headers: [],
            mapping: {},
            filters: {
                country: 'All',
                channel: 'All',
                dateRange: 'All Time'
            },
            documentation: initialDocumentation,
            transformSettings: {
                primaryMetric: 'spend',
                aggregation: {
                    granularity: 'weekly',
                    method: 'sum',
                    weekStarting: 'monday'
                },
                adstock: {
                    type: 'geometric',
                    decayRate: 0.65,
                    lag: 0
                },
                saturation: {
                    active: true,
                    curveType: 'hill',
                    slope: 1.42,
                    inflection: 0.50,
                    gamma: 50000
                },
                metrics: {
                    r2: 0.942,
                    vif: 1.8,
                    rss: '12.4K'
                },
                dateRange: {
                    start: '2023-01-01',
                    end: '2024-01-01'
                },
                currency: 'USD ($)',
                dataSource: 'All Sources',
                controlVariables: {
                    baseMetrics: {
                        priceVariable: 'Average Unit Price',
                        volumeVariable: 'Units Sold'
                    },
                    promotions: {
                        enabled: true,
                        sensitivity: 'high'
                    },
                    timeEffects: {
                        priceChangeLag: 2
                    }
                }
            },
            isLoaded: false,
            activePage: 'login',
            tutorials: [],
            channelColors: {
                'Base': '#64748b',
                'Facebook Ads': '#1877F2',
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
                'Facebook_Video': '#8B4513',
                'Facebook_Lookalike': '#9ACD32',
                'Facebook_Display': '#556B2F',
                'Facebook_Brand': '#3CB371',
                'Facebook_Broad': '#2E8B57',
                'Criteo_Display': '#20B2AA',
                'Bing_Search_NonBrand': '#008B8B',
                'Bing_Search_Brand': '#00CED1',
                'Adtraction_Affiliate': '#4169E1',
                'Facebook_Prospecting': '#1877F2',
                'Facebook_Retargeting': '#3b5998',
                'Google_Search_Brand': '#4285F4',
                'Google_Search_Generic': '#34A853',
                'Google_Display': '#FBBC05',
                'Google_Video': '#EA4335',
                'TV': '#6D28D9',
                'Radio': '#7C3AED',
                'OOH': '#8B5CF6',
                'Print': '#A78BFA'
            },
            chatSessions: [],
            activeChatSessionId: null,
            isProcessing: false,
            hasHydrated: false,
            integrations: [],
            recentSyncRecords: [],


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

            setMapping: (mapping) => set({ mapping }),

            setFilter: (key, value) => set((state) => ({
                filters: { ...state.filters, [key]: value }
            })),

            setTransformSettings: (settings) => set((state) => ({
                transformSettings: {
                    ...state.transformSettings,
                    ...settings,
                    aggregation: settings.aggregation
                        ? { ...state.transformSettings.aggregation, ...settings.aggregation }
                        : state.transformSettings.aggregation,
                    adstock: settings.adstock
                        ? { ...state.transformSettings.adstock, ...settings.adstock }
                        : state.transformSettings.adstock,
                    saturation: settings.saturation
                        ? { ...state.transformSettings.saturation, ...settings.saturation }
                        : state.transformSettings.saturation,
                    metrics: settings.metrics
                        ? { ...state.transformSettings.metrics, ...settings.metrics }
                        : state.transformSettings.metrics,
                    dateRange: settings.dateRange
                        ? { ...state.transformSettings.dateRange, ...settings.dateRange }
                        : state.transformSettings.dateRange,
                    controlVariables: settings.controlVariables
                        ? {
                            ...state.transformSettings.controlVariables,
                            ...settings.controlVariables,
                            baseMetrics: settings.controlVariables.baseMetrics
                                ? { ...state.transformSettings.controlVariables.baseMetrics, ...settings.controlVariables.baseMetrics }
                                : state.transformSettings.controlVariables.baseMetrics,
                            promotions: settings.controlVariables.promotions
                                ? { ...state.transformSettings.controlVariables.promotions, ...settings.controlVariables.promotions }
                                : state.transformSettings.controlVariables.promotions,
                            timeEffects: settings.controlVariables.timeEffects
                                ? { ...state.transformSettings.controlVariables.timeEffects, ...settings.controlVariables.timeEffects }
                                : state.transformSettings.controlVariables.timeEffects,
                        }
                        : state.transformSettings.controlVariables,
                }
            })),

            setActivePage: (page) => set({ activePage: page }),

            addTutorial: (tutorial) => set((state) => ({
                tutorials: [tutorial, ...state.tutorials]
            })),

            deleteTutorial: (id: string) => set((state) => ({
                tutorials: state.tutorials.filter(t => t.id !== id)
            })),

            updateTutorialProgress: (id: string, progress: number) => set((state) => ({
                tutorials: state.tutorials.map(t =>
                    t.id === id
                        ? {
                            ...t,
                            progress,
                            status: progress === 100 ? 'Completed' : progress > 0 ? 'In Progress' : 'Not Started'
                        }
                        : t
                )
            })),

            setChannelColor: (channel: string, color: string) => set((state) => ({
                channelColors: { ...state.channelColors, [channel]: color }
            })),
            
            setChatSessions: (sessions) => set((state) => ({
                chatSessions: typeof sessions === 'function' ? sessions(state.chatSessions) : sessions
            })),
            setActiveChatSessionId: (id) => set({ activeChatSessionId: id }),
            setIsProcessing: (isProcessing) => set({ isProcessing }),
            setHasHydrated: (hasHydrated) => set({ hasHydrated }),
            addMessageToSession: (sessionId, message) => {
                let updatedSession: ChatSession | null = null;
                set((state) => ({
                    chatSessions: state.chatSessions.map(s => 
                        s.id === sessionId 
                            ? (updatedSession = { ...s, messages: [...s.messages, message], lastUpdated: Date.now() })
                            : s
                    )
                }));
                if (updatedSession) {
                    syncSessionMetadata(updatedSession);
                    syncSessionMessage(sessionId, message);
                }
            },
            updateMessageInSession: (sessionId, messageId, content) => {
                let updatedMessage: Message | null = null;
                set((state) => ({
                    chatSessions: state.chatSessions.map(s => 
                        s.id === sessionId 
                            ? { 
                                ...s, 
                                messages: s.messages.map(m => {
                                    if (m.id !== messageId) return m;
                                    updatedMessage = { ...m, content };
                                    return updatedMessage;
                                }),
                                lastUpdated: Date.now() 
                            }
                            : s
                    )
                }));
                const updatedSession = useDataStore.getState().chatSessions.find((session) => session.id === sessionId) ?? null;
                if (updatedSession) {
                    syncSessionMetadata(updatedSession);
                }
                if (updatedMessage) {
                    syncSessionMessage(sessionId, updatedMessage);
                }
            },
            updateChatSession: (sessionId, updates) => {
                let updatedSession: ChatSession | null = null;
                set((state) => ({
                    chatSessions: state.chatSessions.map(s => 
                        s.id === sessionId 
                            ? (updatedSession = { ...s, ...updates, lastUpdated: Date.now() })
                            : s
                    )
                }));
                if (updatedSession) {
                    syncSessionMetadata(updatedSession);
                }
            },
            deleteChatSession: async (id) => {
                // Delete from Supabase first (Cascading Delete)
                try {
                    await supabase.from('chat_sessions').delete().eq('id', id);
                } catch (err) {
                    console.error('Failed to delete chat session from Supabase:', err);
                    toast.error('Failed to delete chat session.');
                }

                set((state) => ({
                    chatSessions: state.chatSessions.filter(s => s.id !== id),
                    activeChatSessionId: state.activeChatSessionId === id ? null : state.activeChatSessionId
                }));
            },
            removeChatSessionLocally: (id) => set((state) => ({
                chatSessions: state.chatSessions.filter(s => s.id !== id),
                activeChatSessionId: state.activeChatSessionId === id ? null : state.activeChatSessionId
            })),
            clearChatSessions: () => set({ chatSessions: [], activeChatSessionId: null }),

            reset: () => set({
                rawData: [],
                headers: [],
                mapping: {},
                filters: {
                    country: 'All',
                    channel: 'All',
                    dateRange: 'All Time'
                },
                documentation: initialDocumentation,
                transformSettings: {
                    primaryMetric: 'spend',
                    aggregation: {
                        granularity: 'weekly',
                        method: 'sum',
                        weekStarting: 'monday'
                    },
                    adstock: {
                        type: 'geometric',
                        decayRate: 0.65,
                        lag: 0
                    },
                    saturation: {
                        active: true,
                        curveType: 'hill',
                        slope: 1.42,
                        inflection: 0.50,
                        gamma: 50000
                    },
                    metrics: {
                        r2: 0.942,
                        vif: 1.8,
                        rss: '12.4K'
                    },
                    dateRange: {
                        start: '2023-01-01',
                        end: '2024-01-01'
                    },
                    currency: 'USD ($)',
                    dataSource: 'All Sources',
                    controlVariables: {
                        baseMetrics: {
                            priceVariable: 'Average Unit Price',
                            volumeVariable: 'Units Sold'
                        },
                        promotions: {
                            enabled: true,
                            sensitivity: 'high'
                        },
                        timeEffects: {
                            priceChangeLag: 2
                        }
                    }
                },
                isLoaded: false,
                activePage: 'login',
                tutorials: [],
                channelColors: {
                    'Base': '#64748b',
                    'Facebook Ads': '#1877F2',
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
                    'Facebook_Video': '#8B4513',
                    'Facebook_Lookalike': '#9ACD32',
                    'Facebook_Display': '#556B2F',
                    'Facebook_Brand': '#3CB371',
                    'Facebook_Broad': '#2E8B57',
                    'Criteo_Display': '#20B2AA',
                    'Bing_Search_NonBrand': '#008B8B',
                    'Bing_Search_Brand': '#00CED1',
                    'Adtraction_Affiliate': '#4169E1'
                },
                isProcessing: false,
                integrations: [],
            }),

            setIntegrations: (integrations) => set({ integrations }),
            fetchIntegrations: async () => {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    set({ integrations: [] });
                    return;
                }

                const { data, error } = await supabase
                    .from('user_integrations')
                    .select('id, platform_id, status, account_name, account_id, last_synced_at, created_at, config')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });
                
                if (error) {
                    console.error('Error fetching integrations:', error);
                    toast.error('Failed to fetch integrations.');
                    return;
                }
                set({ integrations: data || [] });
            },
            addIntegration: async (integration) => {
                const { data: { user } } = await supabase.auth.getUser();
                
                if (!user) {
                    set({ activePage: 'login' });
                    throw new Error('Your session has expired. Please log in again.');
                }

                const { data, error } = await supabase
                    .from('user_integrations')
                    .upsert({ ...integration, user_id: user.id }, { onConflict: 'user_id,platform_id' })
                    .select()
                    .single();
                
                if (error) {
                    console.error('Error adding integration:', error);
                    toast.error('Failed to add integration.');
                    throw error;
                }
                
                set((state) => ({
                    integrations: [data, ...state.integrations.filter(i => i.platform_id !== data.platform_id)]
                }));
            },
            removeIntegration: async (id) => {
                const { error } = await supabase
                    .from('user_integrations')
                    .delete()
                    .eq('id', id);
                
                if (error) {
                    console.error('Error removing integration:', error);
                    toast.error('Failed to remove integration.');
                    return;
                }
                
                set((state) => ({
                    integrations: state.integrations.filter(i => i.id !== id)
                }));
            },
            startPollingIntegrations: () => {
                if (pollingInterval) return;
                
                // Poll every 2 seconds
                pollingInterval = window.setInterval(async () => {
                    const { integrations, fetchIntegrations } = useDataStore.getState();
                    const hasSyncing = integrations.some(i => i.status === 'syncing');
                    
                    if (hasSyncing) {
                        await fetchIntegrations();
                    } else {
                        // If nothing is syncing anymore, we can stop polling to save resources
                        // but usually we let the component manage the lifecycle.
                        // For safety, we'll keep polling as long as the component wants it.
                    }
                }, 2000);
            },
            stopPollingIntegrations: () => {
                if (pollingInterval) {
                    window.clearInterval(pollingInterval);
                    pollingInterval = null;
                }
            },
            fetchRecentSyncRecords: async (integrationId) => {
                const { data, error } = await supabase
                    .from('ad_performance_data')
                    .select('date, campaign_name, spend, impressions, clicks, created_at')
                    .eq('integration_id', integrationId)
                    .order('created_at', { ascending: false })
                    .limit(10);
                
                if (error) {
                    console.error('Error fetching recent sync records:', error);
                    toast.error('Failed to fetch recent sync records.');
                    return;
                }
                
                set({ recentSyncRecords: data || [] });
            },
        }),
        {
            name: 'mmm-dashboard-storage', // Key for IndexedDB
            storage: createJSONStorage(() => storage),
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
            version: 1,
            migrate: (persistedState: unknown) => {
                if (!persistedState || typeof persistedState !== 'object') {
                    return persistedState as DataState;
                }

                const state = persistedState as Partial<DataState>;

                return {
                    ...state,
                    chatSessions: Array.isArray(state.chatSessions)
                        ? state.chatSessions.map(stripSessionAttachmentData)
                        : [],
                } as DataState;
            },
            partialize: (state) => ({
                rawData: state.rawData,
                headers: state.headers,
                mapping: state.mapping,
                filters: state.filters,
                transformSettings: state.transformSettings,
                isLoaded: state.isLoaded,
                tutorials: state.tutorials,
                channelColors: state.channelColors,
                chatSessions: state.chatSessions.map(stripSessionAttachmentData),
                activeChatSessionId: state.activeChatSessionId,
                isProcessing: state.isProcessing,
                // Strip the config object of each integration before persisting to IndexedDB.
                // This ensures that even if a secret were accidentally fetched, it never survives a browser reload.
                integrations: state.integrations.map((integration) => ({
                    ...integration,
                    config: {
                        sync_progress: integration.config?.sync_progress,
                        last_message: integration.config?.last_message,
                        meta_user_name: integration.config?.meta_user_name,
                        selected_account: integration.config?.selected_account,
                        oauth_completed_at: integration.config?.oauth_completed_at,
                    },
                })),
            }),
        }
    )
);
