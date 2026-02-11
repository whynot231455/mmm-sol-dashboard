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

interface DataState {
    rawData: Record<string, unknown>[];
    headers: string[];
    mapping: ColumnMapping;
    filters: Filters;
    isLoaded: boolean;
    activePage: PageType;

    // Actions
    setData: (data: Record<string, unknown>[], headers: string[]) => void;
    setMapping: (mapping: ColumnMapping) => void;
    setFilter: (key: keyof Filters, value: string) => void;
    setActivePage: (page: PageType) => void;
    reset: () => void;
}

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
                isLoaded: state.isLoaded,
            }),
        }
    )
);
