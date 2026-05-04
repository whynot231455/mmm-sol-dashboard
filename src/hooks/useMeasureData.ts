import { useMemo, useState, useEffect } from 'react';
import { useDataStore } from '../store/useDataStore';
import { metaService, type MetaMockInsight } from '../services/metaService';

interface MeasureDataFilters {
    country?: string;
    channel?: string;
    dateRange?: string; // 'last30', 'last90', 'all'
}

interface ProcessedRecord {
    date: string;
    revenue: number;
    spend: number;
    channel: string;
    country: string;
}

export const useMeasureData = (filters?: MeasureDataFilters, options?: { enabled?: boolean }) => {
    const { rawData, mapping } = useDataStore();
    const [metaData, setMetaData] = useState<MetaMockInsight[]>([]);
    const [isLoadingMeta, setIsLoadingMeta] = useState(false);
    const enabled = options?.enabled ?? true;

    // Fetch Meta Data if mapped
    useEffect(() => {
        const fetchMeta = async () => {
            if (!enabled) return;
            setIsLoadingMeta(true);
            try {
                const mappedAccount = await metaService.getMappedAccount();
                if (mappedAccount?.ad_account_id) {
                    const insights = await metaService.fetchMockInsights(mappedAccount.ad_account_id);
                    setMetaData(insights);
                }
            } catch (err) {
                console.error('Failed to load Meta data:', err);
            } finally {
                setIsLoadingMeta(false);
            }
        };

        fetchMeta();
    }, [enabled]);

    // Step 1.1: Pre-process Raw Data and Meta Data into stable numeric format
    // This avoids regex/parsing in the heavy filter/aggregation loop.
    const processedData = useMemo(() => {
        const records: ProcessedRecord[] = [];

        // Process CSV Data
        if (rawData.length > 0 && mapping.revenue && mapping.spend && mapping.date) {
            rawData.forEach((row) => {
                const revenueStr = String(row[mapping.revenue!] || '0');
                const spendStr = String(row[mapping.spend!] || '0');
                
                records.push({
                    date: row[mapping.date!] as string || '',
                    revenue: parseFloat(revenueStr.replace(/[^0-9.-]+/g, '')) || 0,
                    spend: parseFloat(spendStr.replace(/[^0-9.-]+/g, '')) || 0,
                    channel: (row[mapping.channel!] as string) || 'Unknown',
                    country: (row[mapping.country!] as string) || 'Unknown'
                });
            });
        }

        // Process Meta Data
        if (metaData.length > 0) {
            metaData.forEach(row => {
                const spend = parseFloat(row.spend) || 0;
                records.push({
                    date: row.date_start,
                    revenue: spend * 4.2, // Mock 4.2x ROAS
                    spend: spend,
                    channel: 'Meta Ads',
                    country: 'All'
                });
            });
        }

        return records;
    }, [rawData, mapping.revenue, mapping.spend, mapping.date, mapping.channel, mapping.country, metaData]);

    // Extract Unique Values for Dropdowns
    const availableFilters = useMemo(() => {
        if (!enabled || processedData.length === 0) {
            return { countries: ['All'], channels: ['All'] };
        }
        
        const countries = new Set<string>();
        const channels = new Set<string>();

        processedData.forEach(record => {
            if (record.country && record.country !== 'All') countries.add(record.country);
            if (record.channel) channels.add(record.channel);
        });

        return {
            countries: ['All', ...Array.from(countries).sort()],
            channels: ['All', ...Array.from(channels).sort()]
        };
    }, [processedData, enabled]);

    const metrics = useMemo(() => {
        if (!enabled || processedData.length === 0) {
            return null;
        }

        let totalRevenue = 0;
        let totalSpend = 0;
        const trendData: Record<string, { date: string; revenue: number; spend: number; [key: string]: string | number }> = {};
        const channelData: Record<string, { channel: string; revenue: number; spend: number }> = {};

        // Use pre-processed numeric values - extremely fast aggregation
        processedData.forEach((record) => {
            const { date, revenue, spend, channel, country } = record;

            // Apply Filters
            const activeCountry = (filters?.country && filters.country !== 'All') ? filters.country : 'All';
            if (activeCountry !== 'All' && country !== activeCountry) return;

            const activeChannel = (filters?.channel && filters.channel !== 'All') ? filters.channel : 'All';
            if (activeChannel !== 'All' && channel !== activeChannel) return;

            // Date Filtering could go here
            
            totalRevenue += revenue;
            totalSpend += spend;

            if (!trendData[date]) {
                trendData[date] = { date, revenue: 0, spend: 0, 'Base': 0 };
            }

            const baseRevenue = revenue * 0.4;
            const incrementalRevenue = revenue * 0.6;

            trendData[date].revenue += revenue;
            trendData[date].spend += spend;
            trendData[date]['Base'] = (Number(trendData[date]['Base']) || 0) + baseRevenue;

            if (channel !== 'Base') {
                trendData[date][channel] = (Number(trendData[date][channel]) || 0) + incrementalRevenue;
            }

            if (!channelData[channel]) {
                channelData[channel] = { channel, revenue: 0, spend: 0 };
            }
            channelData[channel].revenue += revenue;
            channelData[channel].spend += spend;
        });

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
            filters: availableFilters
        };
    }, [processedData, filters?.country, filters?.channel, filters?.dateRange, availableFilters, enabled]);

    // Separate the loading state from the data object to prevent re-calculation loops
    return useMemo(() => ({
        ...metrics,
        isLoadingMeta
    }), [metrics, isLoadingMeta]);
};

