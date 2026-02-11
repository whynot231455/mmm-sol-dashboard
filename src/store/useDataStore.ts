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

export interface Tutorial {
    id: string;
    title: string;
    description: string;
    thumbnail?: string;
    videoUrl: string;
    duration: string;
    type: 'youtube' | 'upload';
    topic: string;
    views: string;
    progress: number; // 0-100
    isWatched: boolean;
    dateAdded: string;
    isFeatured?: boolean;
}

interface DataState {
    rawData: Record<string, unknown>[];
    headers: string[];
    mapping: ColumnMapping;
    filters: Filters;
    tutorials: Tutorial[];
    isLoaded: boolean;
    activePage: PageType;

    // Actions
    setData: (data: Record<string, unknown>[], headers: string[]) => void;
    setMapping: (mapping: ColumnMapping) => void;
    setFilter: (key: keyof Filters, value: string) => void;
    addTutorial: (tutorial: Tutorial) => void;
    setActivePage: (page: PageType) => void;
    reset: () => void;
}

const initialTutorials: Tutorial[] = [
    {
        id: '1',
        title: 'Getting Started with Sol Analytics',
        description: 'A comprehensive guide to setting up your first marketing mix model. Learn how to ingest data, configure variables, and run your first regression analysis.',
        videoUrl: 'https://youtube.com/watch?v=demo1',
        duration: '15:00',
        type: 'youtube',
        topic: 'Basics',
        views: '1.2k',
        progress: 0,
        isWatched: false,
        dateAdded: new Date().toISOString(),
        isFeatured: true
    },
    {
        id: '2',
        title: 'Intro to Marketing Mix Modeling',
        description: 'Learn the foundational concepts of MMM and why it\'s crucial for budget optimization.',
        videoUrl: 'https://youtube.com/watch?v=demo2',
        duration: '10:00',
        type: 'youtube',
        topic: 'Theory',
        views: '800',
        progress: 100,
        isWatched: true,
        dateAdded: new Array().toString()
    },
    {
        id: '3',
        title: 'Importing your first Dataset',
        description: 'Step-by-step tutorial on cleaning and uploading CSV files.',
        videoUrl: 'https://youtube.com/watch?v=demo3',
        duration: '05:30',
        type: 'youtube',
        topic: 'Data',
        views: '2.5k',
        progress: 45,
        isWatched: false,
        dateAdded: new Array().toString()
    },
    {
        id: '4',
        title: 'Understanding ROAS Curves',
        description: 'Deep dive into Return on Ad Spend curves and diminishing returns.',
        videoUrl: 'https://youtube.com/watch?v=demo4',
        duration: '12:15',
        type: 'youtube',
        topic: 'Advanced',
        views: '1.5k',
        progress: 0,
        isWatched: false,
        dateAdded: new Array().toString()
    },
    {
        id: '5',
        title: 'Advanced Regression Techniques',
        description: 'How to handle seasonality and trend decomposition in your models.',
        videoUrl: 'https://youtube.com/watch?v=demo5',
        duration: '20:00',
        type: 'youtube',
        topic: 'Advanced',
        views: '900',
        progress: 0,
        isWatched: false,
        dateAdded: new Array().toString()
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
            tutorials: initialTutorials,
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

            addTutorial: (tutorial) => set((state) => ({
                tutorials: [tutorial, ...state.tutorials]
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
                tutorials: [],
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
                tutorials: state.tutorials,
                isLoaded: state.isLoaded,
            }),
        }
    )
);
