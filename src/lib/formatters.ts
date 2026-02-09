/**
 * Utility functions for formatting numbers, currencies, and percentages
 */

/**
 * Formats a number as currency (USD)
 * @param value The numeric value
 * @param compact Whether to use compact notation (e.g., 1.2M)
 */
export const formatCurrency = (value: number, compact: boolean = false) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        notation: compact ? 'compact' : 'standard',
        maximumFractionDigits: compact ? 1 : 0,
    }).format(value);
};

/**
 * Formats a number with commas or compact notation
 */
export const formatNumber = (value: number, compact: boolean = false) => {
    return new Intl.NumberFormat('en-US', {
        notation: compact ? 'compact' : 'standard',
        maximumFractionDigits: compact ? 1 : 0,
    }).format(value);
};

/**
 * Formats a number as a percentage
 */
export const formatPercent = (value: number, decimals: number = 1) => {
    return new Intl.NumberFormat('en-US', {
        style: 'percent',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(value / 100);
};

/**
 * Smart formatting that chooses compact notation for large numbers
 */
export const formatSmartCurrency = (value: number) => {
    if (Math.abs(value) >= 1000000) {
        return formatCurrency(value, true);
    }
    if (Math.abs(value) >= 1000) {
        return formatCurrency(value, true);
    }
    return formatCurrency(value, false);
};
