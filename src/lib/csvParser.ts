import * as Papa from 'papaparse';

export interface ParseResult {
    data: any[];
    headers: string[];
    error?: string;
}

export const parseCSV = (file: File): Promise<ParseResult> => {
    return new Promise((resolve) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results: Papa.ParseResult<any>) => {
                resolve({
                    data: results.data,
                    headers: results.meta.fields || [],
                });
            },
            error: (error: Error) => {
                resolve({
                    data: [],
                    headers: [],
                    error: error.message,
                });
            },
        });
    });
};

/**
 * Validates if the required columns are present in the mapping
 */
export const validateMapping = (mapping: Record<string, string>, required: string[]): boolean => {
    return required.every(field => !!mapping[field]);
};
