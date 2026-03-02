import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { StateStorage } from 'zustand/middleware';
import { get, set as idbSet, del } from 'idb-keyval';

// Custom storage for Zustand persistence using IndexedDB (via idb-keyval)
// This enables storing large datasets that exceed localStorage's ~5MB limit.
const storage: StateStorage = {
    getItem: async (name: string): Promise<string | null> => {
        return (await get(name)) || null;
    },
    setItem: async (name: string, value: string): Promise<void> => {
        await idbSet(name, value);
    },
    removeItem: async (name: string): Promise<void> => {
        await del(name);
    },
};

interface ColumnMapping {
    date?: string;
    revenue?: string;
    spend?: string;
    channel?: string;
    country?: string;
    [key: string]: string | undefined;
}

export type PageType =
    | 'login' | 'signup' | 'measure' | 'predict' | 'optimize'
    | 'import' | 'connect' | 'transform'
    | 'train' | 'validate' | 'calibrate'
    | 'video-tutorials' | 'documentation';

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
    };
    saturation: {
        active: boolean;
        curveType: 'hill' | 's-curve' | 'power';
        slope: number;
        inflection: number;
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

    // Actions
    setData: (data: Record<string, unknown>[], headers: string[]) => void;
    setMapping: (mapping: ColumnMapping) => void;
    setFilter: (key: keyof Filters, value: string) => void;
    setTransformSettings: (settings: Partial<TransformSettings>) => void;
    setActivePage: (page: PageType) => void;
    addTutorial: (tutorial: Tutorial) => void;
    updateTutorialProgress: (id: string, progress: number) => void;
    setChannelColor: (channel: string, color: string) => void;
    reset: () => void;
}

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
                    decayRate: 0.65
                },
                saturation: {
                    active: true,
                    curveType: 'hill',
                    slope: 1.42,
                    inflection: 0.50
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

            setData: (data, headers) => set({
                rawData: data,
                headers: headers,
                isLoaded: data.length > 0
            }),

            setMapping: (mapping) => set({ mapping }),

            setFilter: (key, value) => set((state) => ({
                filters: { ...state.filters, [key]: value }
            })),

            setTransformSettings: (settings) => set((state) => ({
                transformSettings: {
                    ...state.transformSettings,
                    ...settings,
                    // Handle nested objects to avoid overwriting them entirely if not provided
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
                tutorials: state.tutorials.filter(t => t.id === id)
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

            setChannelColor: (channel, color) => set((state) => ({
                channelColors: { ...state.channelColors, [channel]: color }
            })),

            reset: () => set({
                rawData: [],
                headers: [],
                mapping: {},
                filters: {
                    country: 'All',
                    channel: 'All',
                    dateRange: 'All Time'
                },
                documentation: [],
                transformSettings: {
                    primaryMetric: 'spend',
                    aggregation: {
                        granularity: 'weekly',
                        method: 'sum',
                        weekStarting: 'monday'
                    },
                    adstock: {
                        type: 'geometric',
                        decayRate: 0.65
                    },
                    saturation: {
                        active: true,
                        curveType: 'hill',
                        slope: 1.42,
                        inflection: 0.50
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
                }
            }),
        }),
        {
            name: 'mmm-dashboard-storage', // Key for IndexedDB
            storage: createJSONStorage(() => storage),
            partialize: (state) => ({
                rawData: state.rawData,
                headers: state.headers,
                mapping: state.mapping,
                filters: state.filters,
                transformSettings: state.transformSettings,
                isLoaded: state.isLoaded,
                tutorials: state.tutorials,
                channelColors: state.channelColors,
            }),
        }
    )
);
