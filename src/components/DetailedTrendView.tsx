import { useState, useMemo } from 'react';
import { 
  ComposedChart, 
  Line, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Brush
} from "recharts";
import { ArrowLeft, RotateCw } from 'lucide-react';
import { formatSmartCurrency } from "../lib/formatters";
import { FilterBar } from "./FilterBar";
import { ZoomControl } from "./ZoomControl";
import { useDataStore } from '../store/useDataStore';

interface DetailedTrendViewProps {
    onBack: () => void;
}

const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

export const DetailedTrendView = ({ onBack }: DetailedTrendViewProps) => {
    const { rawData, mapping } = useDataStore();
    
    // Internal state for detailed filters
    const [selectedMonth, setSelectedMonth] = useState<string>('All Months');
    const [selectedYear, setSelectedYear] = useState<string>('2025'); // Default to 2025 as per image
    const [selectedCountry, setSelectedCountry] = useState<string>('Global');
    const [selectedChannel, setSelectedChannel] = useState<string>('All Channels');

    // Extract categories for filters
    const filterOptions = useMemo(() => {
        if (!rawData.length || !mapping.date || !mapping.country || !mapping.channel) {
            return { months: ['All Months'], years: [], countries: ['Global'], channels: ['All Channels'] };
        }
        
        const months = new Set<string>(['All Months']);
        const years = new Set<string>();
        const countries = new Set<string>(['Global']);
        const channels = new Set<string>(['All Channels']);

        rawData.forEach((row: Record<string, unknown>) => {
            const dateStr = row[mapping.date!] as string;
            const country = row[mapping.country!] as string;
            const channel = row[mapping.channel!] as string;

            if (dateStr) {
                const date = new Date(dateStr);
                const year = date.getFullYear().toString();
                if (!isNaN(parseInt(year))) years.add(year);
                
                const monthIndex = date.getMonth();
                if (!isNaN(monthIndex)) months.add(monthNames[monthIndex]);
            }
            if (country) countries.add(country);
            if (channel) channels.add(channel);
        });

        return {
            months: Array.from(months),
            years: Array.from(years).sort(),
            countries: Array.from(countries).sort(),
            channels: Array.from(channels).sort()
        };
    }, [rawData, mapping]);

    // Better month sorting: keep 'All Months' first, then sort by calendar order
    const sortedMonths = useMemo(() => {
        const months = [...filterOptions.months];
        return months.sort((a, b) => {
            if (a === 'All Months') return -1;
            if (b === 'All Months') return 1;
            return monthNames.indexOf(a) - monthNames.indexOf(b);
        });
    }, [filterOptions.months]);

    // Process and filter data
    const filteredData = useMemo(() => {
        if (!rawData.length || !mapping.date || !mapping.revenue || !mapping.spend) return [];

        const isAllMonths = selectedMonth === 'All Months';
        const isGlobal = selectedCountry === 'Global';
        const isAllChannels = selectedChannel === 'All Channels';

        const aggregated: Record<string, { date: string; spend: number; revenue: number }> = {};

        rawData.forEach((row: Record<string, unknown>) => {
            const dateStr = row[mapping.date!] as string;
            if (!dateStr) return;
            
            const date = new Date(dateStr);
            const year = date.getFullYear().toString();
            const monthName = monthNames[date.getMonth()];
            const country = row[mapping.country!] as string;
            const channel = row[mapping.channel!] as string;

            // Apply filters
            const matchesMonth = isAllMonths || selectedMonth === monthName;
            const matchesYear = !selectedYear || selectedYear === 'All' || selectedYear === year;
            const matchesCountry = isGlobal || selectedCountry === country;
            const matchesChannel = isAllChannels || selectedChannel === channel;

            if (matchesMonth && matchesYear && matchesCountry && matchesChannel) {
                const key = dateStr;
                if (!aggregated[key]) {
                    aggregated[key] = { date: key, spend: 0, revenue: 0 };
                }
                aggregated[key].spend += parseFloat(String(row[mapping.spend!] || 0).replace(/[^0-9.-]+/g, '')) || 0;
                aggregated[key].revenue += parseFloat(String(row[mapping.revenue!] || 0).replace(/[^0-9.-]+/g, '')) || 0;
            }
        });

        return Object.values(aggregated).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [rawData, mapping, selectedMonth, selectedYear, selectedCountry, selectedChannel]);

    // Summary Metrics
    const totals = useMemo(() => {
        return filteredData.reduce((acc, curr) => ({
            spend: acc.spend + curr.spend,
            revenue: acc.revenue + curr.revenue
        }), { spend: 0, revenue: 0 });
    }, [filteredData]);

    const roas = totals.spend > 0 ? totals.revenue / totals.spend : 0;

    // Formatting for tooltip
    const formatValue = (value: number) => formatSmartCurrency(value);

    // Zoom and Pan state for Recharts Brush
    const [zoomIndex, setZoomIndex] = useState<{ start: number; end: number } | null>(null);

    const handleZoomIn = () => {
        if (!filteredData.length) return;
        const currentStart = zoomIndex?.start ?? 0;
        const currentEnd = zoomIndex?.end ?? filteredData.length - 1;
        const mid = Math.floor((currentStart + currentEnd) / 2);
        const newRange = Math.max(5, Math.floor((currentEnd - currentStart) * 0.7)); // Reduce range by 30%
        setZoomIndex({
            start: Math.max(0, mid - Math.floor(newRange / 2)),
            end: Math.min(filteredData.length - 1, mid + Math.floor(newRange / 2))
        });
    };

    const handleZoomOut = () => {
        if (!filteredData.length) return;
        const currentStart = zoomIndex?.start ?? 0;
        const currentEnd = zoomIndex?.end ?? filteredData.length - 1;
        const mid = Math.floor((currentStart + currentEnd) / 2);
        const newRange = Math.min(filteredData.length, Math.ceil((currentEnd - currentStart) * 1.3)); // Increase range by 30%
        setZoomIndex({
            start: Math.max(0, mid - Math.floor(newRange / 2)),
            end: Math.min(filteredData.length - 1, mid + Math.floor(newRange / 2))
        });
    };

    const handleResetZoom = () => setZoomIndex(null);

    return (
        <div className="flex flex-col gap-8 animate-in slide-in-from-right-8 duration-500 ease-out pb-12">
            {/* Extended Header Area */}
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={onBack}
                            className="p-3 bg-white border border-slate-200 rounded-full text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all active:scale-95 shadow-sm"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Spend vs Revenue Trend</h1>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-sm font-semibold text-slate-400">Detailed View</span>
                                <span className="text-[10px] py-0.5 px-2 bg-red-50 text-brand-secondary rounded-full font-black uppercase tracking-wider border border-red-100/50 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-brand-secondary rounded-full animate-pulse"></span>
                                    Live Data
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <FilterBar 
                            months={sortedMonths}
                            years={filterOptions.years}
                            countries={filterOptions.countries}
                            channels={filterOptions.channels}
                            selectedMonth={selectedMonth}
                            selectedYear={selectedYear}
                            selectedCountry={selectedCountry}
                            selectedChannel={selectedChannel}
                            onMonthChange={setSelectedMonth}
                            onYearChange={setSelectedYear}
                            onCountryChange={setSelectedCountry}
                            onChannelChange={setSelectedChannel}
                        />
                        <button className="p-3 text-slate-400 hover:text-slate-600 transition-colors">
                            <RotateCw size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Chart Card */}
            <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50">
                <div className="flex items-start justify-between mb-8">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Performance Over Time</h2>
                        <p className="text-slate-400 text-sm mt-1">Daily aggregation of spend vs attributed revenue.</p>
                    </div>
                    <div className="flex items-center gap-8">
                        <div className="text-right">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Total Spend</span>
                            <span className="text-xl font-black text-slate-900 tracking-tight">{formatValue(totals.spend)}</span>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Total Rev</span>
                            <span className="text-xl font-black text-slate-900 tracking-tight">{formatValue(totals.revenue)}</span>
                        </div>
                        <div className="text-right pl-8 border-l border-slate-100">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">ROAS</span>
                            <span className="text-xl font-black text-green-500 tracking-tight">{roas.toFixed(1)}x</span>
                        </div>
                    </div>
                </div>

                <div className="h-[500px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart 
                            data={filteredData}
                            margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                        >
                            <defs>
                                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#bcbabaff" stopOpacity={1} />
                                    <stop offset="100%" stopColor="#bcbabaff" stopOpacity={0.8} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis 
                                dataKey="date" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                                dy={15}
                                minTickGap={40}
                                tickFormatter={(tick) => {
                                    const d = new Date(tick);
                                    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                }}
                            />
                            <YAxis 
                                yAxisId="left"
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                                tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`}
                                label={{ value: 'Spend', angle: -90, position: 'insideLeft', offset: -5, fill: '#94a3b8', fontSize: 10, fontWeight: 800 }}
                            />
                            <YAxis 
                                yAxisId="right"
                                orientation="right"
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                                tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`}
                                label={{ value: 'Revenue', angle: 90, position: 'insideRight', offset: -5, fill: '#94a3b8', fontSize: 10, fontWeight: 800 }}
                            />
                            <Tooltip 
                                cursor={{ stroke: '#f1f5f9', strokeWidth: 2 }}
                                contentStyle={{ 
                                    backgroundColor: '#fff', 
                                    borderRadius: '16px', 
                                    border: '1px solid #e2e8f0',
                                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                    padding: '12px'
                                }}
                                formatter={(value: number | undefined, name: string) => [
                                    <span className="font-bold text-slate-900">{formatValue(value || 0)}</span>,
                                    <span className="text-slate-500 font-medium">{name}</span>
                                ]}
                            />
                            <Bar 
                                yAxisId="left"
                                dataKey="spend" 
                                fill="url(#barGradient)"
                                barSize={12}
                                radius={[4, 4, 0, 0]}
                                name="Marketing Spend"
                            />
                            <Line 
                                yAxisId="right"
                                type="monotone" 
                                dataKey="revenue" 
                                stroke="#871F1E" 
                                strokeWidth={3} 
                                dot={false}
                                activeDot={{ r: 6, strokeWidth: 0, fill: '#871F1E' }}
                                name="Revenue"
                            />
                            <Brush 
                                dataKey="date" 
                                height={0} 
                                startIndex={zoomIndex?.start} 
                                endIndex={zoomIndex?.end}
                                onChange={(val) => setZoomIndex({ start: val.startIndex ?? 0, end: val.endIndex ?? 0 })}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>

                {/* Legend and Zoom Controls */}
                <div className="flex items-center justify-between mt-8 pt-8 border-t border-slate-50">
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-[#bcbabaff] rounded-sm"></div>
                            <span className="text-xs font-bold text-slate-500">Marketing Spend</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-1 bg-[#871F1E] rounded-full"></div>
                            <span className="text-xs font-bold text-slate-500">Revenue</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-4 mr-2">
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Zoom</span>
                            <div className="w-48 h-10 bg-slate-50 rounded-xl relative overflow-hidden border border-slate-100 flex items-center px-4">
                               <div className="w-full h-1 bg-slate-200 rounded-full">
                                    <div 
                                        className="h-full bg-brand-primary/20 absolute"
                                        style={{
                                            left: `${((zoomIndex?.start ?? 0) / (filteredData.length || 1)) * 100}%`,
                                            width: `${(((zoomIndex?.end ?? (filteredData.length - 1)) - (zoomIndex?.start ?? 0)) / (filteredData.length || 1)) * 100}%`
                                        }}
                                    ></div>
                               </div>
                               {/* Simplified visual scrubber handles as per design */}
                               <div 
                                    className="absolute h-5 w-1 bg-brand-primary rounded-full shadow-sm"
                                    style={{ left: `${((zoomIndex?.start ?? 0) / (filteredData.length || 1)) * 100}%` }}
                               ></div>
                               <div 
                                    className="absolute h-5 w-1 bg-brand-primary rounded-full shadow-sm"
                                    style={{ left: `${((zoomIndex?.end ?? (filteredData.length - 1)) / (filteredData.length || 1)) * 100}%` }}
                               ></div>
                            </div>
                        </div>
                        <ZoomControl 
                            onZoomIn={handleZoomIn}
                            onZoomOut={handleZoomOut}
                            onReset={handleResetZoom}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
