import { useMemo } from 'react';
import { useDataStore } from '../store/useDataStore';

interface MeasureDataFilters {
    country?: string;
    channel?: string;
    dateRange?: string; // 'last30', 'last90', 'all'
}

export const useMeasureData = (filters?: MeasureDataFilters) => {
    const { rawData, mapping } = useDataStore();

    const metrics = useMemo(() => {
        if (!rawData.length || !mapping.revenue || !mapping.spend || !mapping.date) {
            return null;
        }

        let filteredData = rawData;

        // Apply Filters
        if (filters?.country && filters.country !== 'All') {
            filteredData = filteredData.filter(row => row[mapping.country!] === filters.country);
        }

        if (filters?.channel && filters.channel !== 'All') {
            filteredData = filteredData.filter(row => row[mapping.channel!] === filters.channel);
        }

        // Date Filtering
        if (filters?.dateRange && filters.dateRange !== 'All Time') {
            const rowDates = rawData
                .map(row => {
                        const val = row[mapping.date!] as string | undefined;
                        if (!val) return null;
                        const d = new Date(val);
                        return isNaN(d.getTime()) ? null : d;
                    })
                .filter((d): d is Date => d !== null);

            const maxDate = rowDates.length > 0
                ? new Date(rowDates.map(d => d.getTime()).reduce((a, b) => Math.max(a, b)))
                : new Date();

            let minDate: Date | null = null;

            if (filters.dateRange === 'Last 30 Days') {
                minDate = new Date(maxDate);
                minDate.setDate(maxDate.getDate() - 30);
            } else if (filters.dateRange === 'Last 90 Days') {
                minDate = new Date(maxDate);
                minDate.setDate(maxDate.getDate() - 90);
            }

            if (minDate) {
                // Adjust minDate to start of day and maxDate to end of day to be inclusive
                minDate.setHours(0, 0, 0, 0);
                maxDate.setHours(23, 59, 59, 999);

                filteredData = filteredData.filter(row => {
                    const val = row[mapping.date!] as string | undefined;
                    if (!val) return false;
                    const rowDate = new Date(val);
                    return !isNaN(rowDate.getTime()) && rowDate >= minDate! && rowDate <= maxDate;
                });
            }
        }

        // Extract Unique Values for Dropdowns
        const uniqueCountries = Array.from(new Set(rawData.map(row => row[mapping.country!] as string | undefined).filter(Boolean) as string[])).sort();
        const uniqueChannels = Array.from(new Set(rawData.map(row => row[mapping.channel!] as string | undefined).filter(Boolean) as string[])).sort();


        let totalRevenue = 0;
        let totalSpend = 0;
        const trendData: Record<string, { date: string; revenue: number; spend: number }> = {};
        const channelData: Record<string, { channel: string; revenue: number; spend: number }> = {};

        filteredData.forEach((row) => {
            const revenue = parseFloat(String(row[mapping.revenue!] || 0).replace(/[^0-9.-]+/g, '')) || 0;
            const spend = parseFloat(String(row[mapping.spend!] || 0).replace(/[^0-9.-]+/g, '')) || 0;
            const date = row[mapping.date!] as string | undefined;
            const channel = (row[mapping.channel!] as string | undefined) || 'Unknown';

            totalRevenue += revenue;
            totalSpend += spend;

            // Trend Data (Group by Date)
            if (date) {
                if (!trendData[date]) {
                    trendData[date] = { date, revenue: 0, spend: 0 };
                }
                trendData[date].revenue += revenue;
                trendData[date].spend += spend;
            }

            // Channel Data (Group by Channel)
            if (!channelData[channel]) {
                channelData[channel] = { channel, revenue: 0, spend: 0 };
            }
            channelData[channel].revenue += revenue;
            channelData[channel].spend += spend;
        });

        // Calculate Derived Metrics
        const roi = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0;
        const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;

        return {
            kpi: {
                revenue: totalRevenue,
                spend: totalSpend,
                roi,
                roas,
            },
            trend: Object.values(trendData).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
            channels: Object.values(channelData).sort((a, b) => b.revenue - a.revenue),
            filters: {
                countries: ['All', ...uniqueCountries],
                channels: ['All', ...uniqueChannels]
            }
        };
    }, [rawData, mapping, filters]);

    return metrics;
};
