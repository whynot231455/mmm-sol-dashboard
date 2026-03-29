import { useMemo, useState, useRef, useEffect } from "react";
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
} from "recharts";
import { TrendingUp, X } from "lucide-react";
import { formatSmartCurrency } from "../lib/formatters";
import { useDataStore } from "../store/useDataStore";

/* ── Curated colour swatches ── */

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

/* ── Types ── */

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

/* ── Custom Legend with colour palette popover ── */

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
      {payload?.map((entry: LegendEntry, index: number) => {
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

            {/* Colour palette popover */}
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
      <button className="text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-wider ml-auto">
        Hide all
      </button>
    </div>
  );
};

/* ── TrendChart ── */

interface TrendChartProps {
  data: Array<{
    date: string | Date;
    spend: number;
    revenue: number;
    [key: string]: string | number | Date | boolean | null | undefined;
  }>;
  onExpand?: () => void;
}

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

export const TrendChart = ({ data, onExpand }: TrendChartProps) => {
  const { channelColors, setChannelColor } = useDataStore();
  const [activeChannel, setActiveChannel] = useState<string | null>(null);

  const getChannelColor = (channel: string) => {
    if (channelColors[channel]) return channelColors[channel];
    let hash = 0;
    for (let i = 0; i < channel.length; i++) {
      hash = channel.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % defaultPalette.length;
    return defaultPalette[index];
  };

  const channels = useMemo(() => {
    if (!data.length) return [];
    const keys = Object.keys(data[0]);
    return keys
      .filter((k) => k !== "date" && k !== "revenue" && k !== "spend")
      .sort((a, b) => {
        if (a === "Base") return -1;
        if (b === "Base") return 1;
        return a.localeCompare(b);
      });
  }, [data]);

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

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-[500px] group flex flex-col">
      <div
        className="flex items-center justify-between mb-6"
        onClick={onExpand}
      >
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            Revenue Incrementality
          </h3>
          <p className="text-slate-500 text-sm">
            Channel contribution over time
          </p>
        </div>
        <div className="p-2 rounded-lg bg-slate-50 text-slate-400 group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-colors cursor-pointer">
          <TrendingUp size={18} />
        </div>
      </div>

      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <ComposedChart
            data={data}
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
                value: number | undefined,
                name: string | undefined,
              ) => [formatSmartCurrency(value ?? 0), name ?? ""]}
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
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
