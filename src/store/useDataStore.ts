import { create } from 'zustand';

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
    | 'train' | 'validate' | 'calibrate';

interface DataState {
    rawData: any[];
    headers: string[];
    mapping: ColumnMapping;
    isLoaded: boolean;
    activePage: PageType;

    // Actions
    setData: (data: any[], headers: string[]) => void;
    setMapping: (mapping: ColumnMapping) => void;
    setActivePage: (page: PageType) => void;
    reset: () => void;
}

export const useDataStore = create<DataState>((set) => ({
    rawData: [],
    headers: [],
    mapping: {},
    isLoaded: false,
    activePage: 'measure',

    setData: (data, headers) => set({
        rawData: data,
        headers: headers,
        isLoaded: data.length > 0
    }),

    setMapping: (mapping) => set({ mapping }),

    setActivePage: (page) => set({ activePage: page }),

    reset: () => set({
        rawData: [],
        headers: [],
        mapping: {},
        isLoaded: false,
        activePage: 'measure'
    }),
}));
