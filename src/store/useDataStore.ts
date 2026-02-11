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
    | 'measure' | 'predict' | 'optimize'
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

interface DataState {
    rawData: Record<string, unknown>[];
    headers: string[];
    mapping: ColumnMapping;
    filters: Filters;
    documentation: DocSection[];
    isLoaded: boolean;
    activePage: PageType;

    // Actions
    setData: (data: Record<string, unknown>[], headers: string[]) => void;
    setMapping: (mapping: ColumnMapping) => void;
    setFilter: (key: keyof Filters, value: string) => void;
    setActivePage: (page: PageType) => void;
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
            isLoaded: false,
            activePage: 'measure',

            setData: (data, headers) => set({
                rawData: data,
                headers: headers,
                isLoaded: data.length > 0
            }),

            setMapping: (mapping) => set({ mapping }),

            setFilter: (key, value) => set((state) => ({
                filters: { ...state.filters, [key]: value }
            })),

            setActivePage: (page) => set({ activePage: page }),

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
                isLoaded: false,
                activePage: 'measure'
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
                documentation: state.documentation,
                isLoaded: state.isLoaded,
            }),
        }
    )
);
