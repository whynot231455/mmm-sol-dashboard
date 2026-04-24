import { useState, useMemo, useRef, useEffect } from "react";
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Brush,
} from "recharts";
import { ArrowLeft, RotateCw, X } from "lucide-react";
import { formatSmartCurrency } from "../lib/formatters";
import { FilterBar } from "./FilterBar";
import { ZoomControl } from "./ZoomControl";
import { useDataStore } from "../store/useDataStore";

/* ── Curated colour swatches (same as TrendChart) ── */

const colorSwatches = [
  // Row 1 — Reds & Pinks
  "#ef4444",
  "#f43f5e",
  "#ec4899",
  "#f472b6",
  // Row 2 — Purples & Indigos
  "#a855f7",
  "#8b5cf6",
  "#6366f1",
  "#818cf8",
  // Row 3 — Blues
  "#3b82f6",
  "#0ea5e9",
  "#06b6d4",
  "#22d3ee",
  // Row 4 — Greens & Teals
  "#14b8a6",
  "#10b981",
  "#22c55e",
  "#84cc16",
  // Row 5 — Yellows & Oranges
  "#eab308",
  "#f59e0b",
  "#f97316",
  "#fb923c",
  // Row 6 — Neutrals & Extras
  "#64748b",
  "#475569",
  "#d946ef",
  "#f43f5e",
];

/* ── Custom Legend with colour palette popover ── */

interface LegendEntry {
  dataKey: string;
  value: string;
  color: string;
}

interface CustomLegendProps {
  payload?: LegendEntry[];
  activeChannel: string | null;
  onSwatchClick: (channel: string) => void;
  onColorSelect: (color: string) => void;
  onClose: () => void;
}

const CustomLegend = ({
  payload,
  activeChannel,
  onSwatchClick,
  onColorSelect,
  onClose,
}: CustomLegendProps) => {
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeChannel) return;
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [activeChannel, onClose]);

  return (
    <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 px-2 items-center">
      {payload?.map((entry, index) => {
        if (entry.dataKey === "spend" || entry.dataKey === "revenue")
          return null;

        const isEditing = activeChannel === entry.value;

        return (
          <div
            key={`item-${index}`}
            className="relative flex items-center gap-2"
          >
            <div
              className="w-3 h-3 rounded-sm cursor-pointer transition-transform hover:scale-125 ring-offset-1 hover:ring-2 hover:ring-slate-300"
              style={{ backgroundColor: entry.color }}
              onClick={() => onSwatchClick(entry.value)}
            />
            <span className="text-xs font-medium text-slate-600">
              {entry.value}
            </span>

            {isEditing && (
              <div
                ref={pickerRef}
                className="absolute left-0 top-full mt-2 z-50 bg-white border border-slate-200 rounded-xl shadow-xl p-3 animate-in fade-in slide-in-from-top-1 duration-150"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Pick a colour
                  </span>
                  <button
                    onClick={onClose}
                    className="p-0.5 text-slate-300 hover:text-slate-500 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {colorSwatches.map((color, i) => (
                    <button
                      key={`${color}-${i}`}
                      onClick={() => onColorSelect(color)}
                      className="w-6 h-6 rounded-md border border-white/50 transition-all hover:scale-110 hover:shadow-md hover:ring-2 hover:ring-offset-1 hover:ring-slate-300 active:scale-95"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
      <div className="flex items-center gap-2">
        <div className="w-6 h-0.5 bg-[#871F1E] rounded-full" />
        <span className="text-xs font-medium text-slate-600">
          Total Revenue
        </span>
      </div>
    </div>
  );
};

/* ── Constants ── */

interface DetailedTrendViewProps {
  onBack: () => void;
}

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const defaultPalette = [
  "#f43f5e",
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#10b981",
  "#14b8a6",
  "#06b6d4",
  "#0ea5e9",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#d946ef",
  "#ec4899",
  "#f43f5e",
];

/* ── Component ── */

export const DetailedTrendView = ({ onBack }: DetailedTrendViewProps) => {
  const { rawData, mapping, channelColors, setChannelColor } = useDataStore();

  // Internal state for detailed filters
  const [selectedMonth, setSelectedMonth] = useState<string>("All Months");
  const [selectedYear, setSelectedYear] = useState<string>("2025");
  const [selectedCountry, setSelectedCountry] = useState<string>("Global");
  const [selectedChannel, setSelectedChannel] =
    useState<string>("All Channels");

  // Palette picker state
  const [activeChannel, setActiveChannel] = useState<string | null>(null);

  /* ── Color helpers (same logic as TrendChart) ── */

  const getChannelColor = (channel: string) => {
    if (channelColors[channel]) return channelColors[channel];
    let hash = 0;
    for (let i = 0; i < channel.length; i++) {
      hash = channel.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % defaultPalette.length;
    return defaultPalette[index];
  };

  const handleSwatchClick = (channel: string) => {
    setActiveChannel((prev) => (prev === channel ? null : channel));
  };

  const handleColorSelect = (color: string) => {
    if (activeChannel) {
      setChannelColor(activeChannel, color);
    }
    setActiveChannel(null);
  };

  const handleClose = () => {
    setActiveChannel(null);
  };

  /* ── Filter options ── */

  const filterOptions = useMemo(() => {
    if (
      !rawData.length ||
      !mapping.date ||
      !mapping.country ||
      !mapping.channel
    ) {
      return {
        months: ["All Months"],
        years: [],
        countries: ["Global"],
        channels: ["All Channels"],
      };
    }

    const months = new Set<string>(["All Months"]);
    const years = new Set<string>();
    const countries = new Set<string>(["Global"]);
    const channels = new Set<string>(["All Channels"]);

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
      channels: Array.from(channels).sort(),
    };
  }, [rawData, mapping]);

  const sortedMonths = useMemo(() => {
    const months = [...filterOptions.months];
    return months.sort((a, b) => {
      if (a === "All Months") return -1;
      if (b === "All Months") return 1;
      return monthNames.indexOf(a) - monthNames.indexOf(b);
    });
  }, [filterOptions.months]);

  /* ── Data aggregation — per-channel breakdown ── */

  const filteredData = useMemo(() => {
    if (!rawData.length || !mapping.date || !mapping.revenue || !mapping.spend)
      return [];

    const isAllMonths = selectedMonth === "All Months";
    const isGlobal = selectedCountry === "Global";
    const isAllChannels = selectedChannel === "All Channels";

    const aggregated: Record<
      string,
      {
        date: string;
        revenue: number;
        spend: number;
        Base: number;
        [key: string]: string | number;
      }
    > = {};

    rawData.forEach((row: Record<string, unknown>) => {
      const dateStr = row[mapping.date!] as string;
      if (!dateStr) return;

      const date = new Date(dateStr);
      const year = date.getFullYear().toString();
      const monthName = monthNames[date.getMonth()];
      const country = row[mapping.country!] as string;
      const channel = (row[mapping.channel!] as string) || "Unknown";

      const matchesMonth = isAllMonths || selectedMonth === monthName;
      const matchesYear =
        !selectedYear || selectedYear === "All" || selectedYear === year;
      const matchesCountry = isGlobal || selectedCountry === country;
      const matchesChannel = isAllChannels || selectedChannel === channel;

      if (matchesMonth && matchesYear && matchesCountry && matchesChannel) {
        const key = dateStr;
        const revenue =
          parseFloat(
            String(row[mapping.revenue!] || 0).replace(/[^0-9.-]+/g, ""),
          ) || 0;
        const spend =
          parseFloat(
            String(row[mapping.spend!] || 0).replace(/[^0-9.-]+/g, ""),
          ) || 0;

        if (!aggregated[key]) {
          aggregated[key] = { date: key, spend: 0, revenue: 0, Base: 0 };
        }

        const baseRevenue = revenue * 0.4;
        const incrementalRevenue = revenue * 0.6;

        aggregated[key].spend += spend;
        aggregated[key].revenue += revenue;
        aggregated[key].Base = (aggregated[key].Base as number) + baseRevenue;

        if (!aggregated[key][channel]) {
          aggregated[key][channel] = 0;
        }
        aggregated[key][channel] =
          (aggregated[key][channel] as number) + incrementalRevenue;
      }
    });

    return Object.values(aggregated).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
  }, [
    rawData,
    mapping,
    selectedMonth,
    selectedYear,
    selectedCountry,
    selectedChannel,
  ]);

  /* ── Detect channel keys ── */

  const channels = useMemo(() => {
    if (!filteredData.length) return [];
    const keys = Object.keys(filteredData[0]);
    return keys
      .filter((k) => k !== "date" && k !== "revenue" && k !== "spend")
      .sort((a, b) => {
        if (a === "Base") return -1;
        if (b === "Base") return 1;
        return a.localeCompare(b);
      });
  }, [filteredData]);

  /* ── Summary metrics ── */

  const totals = useMemo(() => {
    return filteredData.reduce(
      (acc, curr) => ({
        spend: acc.spend + (curr.spend as number),
        revenue: acc.revenue + (curr.revenue as number),
      }),
      { spend: 0, revenue: 0 },
    );
  }, [filteredData]);

  const roas = totals.spend > 0 ? totals.revenue / totals.spend : 0;
  const formatValue = (value: number) => formatSmartCurrency(value);

  /* ── Zoom state ── */

  const [zoomIndex, setZoomIndex] = useState<{
    start: number;
    end: number;
  } | null>(null);

  const handleZoomIn = () => {
    if (!filteredData.length) return;
    const currentStart = zoomIndex?.start ?? 0;
    const currentEnd = zoomIndex?.end ?? filteredData.length - 1;
    const mid = Math.floor((currentStart + currentEnd) / 2);
    const newRange = Math.max(5, Math.floor((currentEnd - currentStart) * 0.7));
    setZoomIndex({
      start: Math.max(0, mid - Math.floor(newRange / 2)),
      end: Math.min(filteredData.length - 1, mid + Math.floor(newRange / 2)),
    });
  };

  const handleZoomOut = () => {
    if (!filteredData.length) return;
    const currentStart = zoomIndex?.start ?? 0;
    const currentEnd = zoomIndex?.end ?? filteredData.length - 1;
    const mid = Math.floor((currentStart + currentEnd) / 2);
    const newRange = Math.min(
      filteredData.length,
      Math.ceil((currentEnd - currentStart) * 1.3),
    );
    setZoomIndex({
      start: Math.max(0, mid - Math.floor(newRange / 2)),
      end: Math.min(filteredData.length - 1, mid + Math.floor(newRange / 2)),
    });
  };

  const handleResetZoom = () => setZoomIndex(null);

  /* ── Render ── */

  return (
    <div className="flex flex-col gap-8 animate-in slide-in-from-right-8 duration-500 ease-out pb-12">
      {/* Header */}
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
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Revenue Incrementality
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-sm font-semibold text-slate-400">
                  Detailed View
                </span>
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
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Channel Contribution Over Time
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Stacked channel breakdown with revenue overlay.
            </p>
          </div>
          <div className="flex items-center gap-8">
            <div className="text-right">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                Total Spend
              </span>
              <span className="text-xl font-black text-slate-900 tracking-tight">
                {formatValue(totals.spend)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                Total Rev
              </span>
              <span className="text-xl font-black text-slate-900 tracking-tight">
                {formatValue(totals.revenue)}
              </span>
            </div>
            <div className="text-right pl-8 border-l border-slate-100">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                ROAS
              </span>
              <span className="text-xl font-black text-green-500 tracking-tight">
                {roas.toFixed(1)}x
              </span>
            </div>
          </div>
        </div>

        <div className="h-[500px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <ComposedChart
              data={filteredData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f1f5f9"
              />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 500 }}
                dy={10}
                minTickGap={30}
                tickFormatter={(tick) => {
                  const d = new Date(tick);
                  return `w${Math.ceil((d.getDate() - 1 + new Date(d.getFullYear(), d.getMonth(), 1).getDay()) / 7)} ${d.getFullYear()}`;
                }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 500 }}
                tickFormatter={(value) => formatSmartCurrency(value)}
              />
              <Tooltip
                formatter={(
                  value: unknown,
                  name: string | undefined,
                ) => [formatSmartCurrency(Number(value ?? 0)), name ?? ""]}
                contentStyle={{
                  backgroundColor: "#fff",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  fontSize: "12px",
                }}
              />
              <Legend
                content={
                  <CustomLegend
                    activeChannel={activeChannel}
                    onSwatchClick={handleSwatchClick}
                    onColorSelect={handleColorSelect}
                    onClose={handleClose}
                  />
                }
              />

              {channels.map((channel) => (
                <Bar
                  key={channel}
                  dataKey={channel}
                  stackId="a"
                  fill={getChannelColor(channel)}
                  barSize={20}
                  name={channel}
                  radius={[0, 0, 0, 0]}
                />
              ))}

              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#871F1E"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
                name="Total Revenue"
              />
              <Brush
                dataKey="date"
                height={0}
                startIndex={zoomIndex?.start}
                endIndex={zoomIndex?.end}
                onChange={(val) =>
                  setZoomIndex({
                    start: val.startIndex ?? 0,
                    end: val.endIndex ?? 0,
                  })
                }
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center justify-end mt-8 pt-8 border-t border-slate-50">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4 mr-2">
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
                Zoom
              </span>
              <div className="w-48 h-10 bg-slate-50 rounded-xl relative overflow-hidden border border-slate-100 flex items-center px-4">
                <div className="w-full h-1 bg-slate-200 rounded-full">
                  <div
                    className="h-full bg-brand-primary/20 absolute"
                    style={{
                      left: `${((zoomIndex?.start ?? 0) / (filteredData.length || 1)) * 100}%`,
                      width: `${(((zoomIndex?.end ?? filteredData.length - 1) - (zoomIndex?.start ?? 0)) / (filteredData.length || 1)) * 100}%`,
                    }}
                  ></div>
                </div>
                <div
                  className="absolute h-5 w-1 bg-brand-primary rounded-full shadow-sm"
                  style={{
                    left: `${((zoomIndex?.start ?? 0) / (filteredData.length || 1)) * 100}%`,
                  }}
                ></div>
                <div
                  className="absolute h-5 w-1 bg-brand-primary rounded-full shadow-sm"
                  style={{
                    left: `${((zoomIndex?.end ?? filteredData.length - 1) / (filteredData.length || 1)) * 100}%`,
                  }}
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
