import { ChevronDown, Globe, Filter, Calendar, Clock } from 'lucide-react';

interface FilterBarProps {
    months: string[];
    years: string[];
    countries: string[];
    channels: string[];
    selectedMonth: string;
    selectedYear: string;
    selectedCountry: string;
    selectedChannel: string;
    onMonthChange: (month: string) => void;
    onYearChange: (year: string) => void;
    onCountryChange: (country: string) => void;
    onChannelChange: (channel: string) => void;
}

export const FilterBar = ({
    months,
    years,
    countries,
    channels,
    selectedMonth,
    selectedYear,
    selectedCountry,
    selectedChannel,
    onMonthChange,
    onYearChange,
    onCountryChange,
    onChannelChange
}: FilterBarProps) => {
    return (
        <div className="flex items-center gap-3">
            {/* Month Filter */}
            <div className="relative group">
                <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-brand-primary/50 transition-colors" />
                <select 
                    value={selectedMonth}
                    onChange={(e) => onMonthChange(e.target.value)}
                    className="appearance-none pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-primary/10 focus:border-brand-primary cursor-pointer shadow-sm hover:border-slate-300 transition-all min-w-[120px]"
                >
                    {months.map(month => (
                        <option key={month} value={month}>{month === 'All Months' ? 'Month: All' : month}</option>
                    ))}
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Year Filter */}
            <div className="relative group">
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-brand-primary/50 transition-colors" />
                <select 
                    value={selectedYear}
                    onChange={(e) => onYearChange(e.target.value)}
                    className="appearance-none pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-primary/10 focus:border-brand-primary cursor-pointer shadow-sm hover:border-slate-300 transition-all min-w-[100px]"
                >
                    {years.map(year => (
                        <option key={year} value={year}>{year === 'All' ? 'Year: All' : year}</option>
                    ))}
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Country Filter */}
            <div className="relative group">
                <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-brand-primary/50 transition-colors" />
                <select 
                    value={selectedCountry}
                    onChange={(e) => onCountryChange(e.target.value)}
                    className="appearance-none pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-primary/10 focus:border-brand-primary cursor-pointer shadow-sm hover:border-slate-300 transition-all min-w-[120px]"
                >
                    {countries.map(country => (
                        <option key={country} value={country}>{country === 'Global' ? 'Country: Global' : country}</option>
                    ))}
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Channel Filter */}
            <div className="relative group">
                <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-brand-primary/50 transition-colors" />
                <select 
                    value={selectedChannel}
                    onChange={(e) => onChannelChange(e.target.value)}
                    className="appearance-none pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-primary/10 focus:border-brand-primary cursor-pointer shadow-sm hover:border-slate-300 transition-all min-w-[140px]"
                >
                    {channels.map(channel => (
                        <option key={channel} value={channel}>{channel === 'All Channels' ? 'Channel: All' : channel}</option>
                    ))}
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
        </div>
    );
};
