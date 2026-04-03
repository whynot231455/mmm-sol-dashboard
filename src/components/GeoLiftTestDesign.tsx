import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import {
  MapPin,
  Users,
  DollarSign,
  ArrowRight,
  ArrowLeft,
  Zap,
  Shield,
  Info,
} from "lucide-react";
import type { GeoRegion, PowerAnalysisPoint } from "../hooks/useGeoLiftData";

interface GeoLiftTestDesignProps {
  regions: GeoRegion[];
  powerAnalysis: PowerAnalysisPoint[];
}

export const GeoLiftTestDesign = ({
  regions,
  powerAnalysis,
}: GeoLiftTestDesignProps) => {
  const [localRegions, setLocalRegions] = useState<GeoRegion[]>(regions);
  const [config, setConfig] = useState({
    testName: "",
    channel: "Facebook Ads",
    kpi: "Revenue",
    budget: 150000,
    durationWeeks: 8,
  });

  const treatmentRegions = localRegions.filter((r) => r.group === "treatment");
  const controlRegions = localRegions.filter((r) => r.group === "control");
  const unassignedRegions = localRegions.filter(
    (r) => r.group === "unassigned",
  );

  const assignRegion = (
    id: string,
    group: "treatment" | "control" | "unassigned",
  ) => {
    setLocalRegions((prev) =>
      prev.map((r) => (r.id === id ? { ...r, group } : r)),
    );
  };

  const avgSimilarity =
    controlRegions.length > 0
      ? Math.round(
          controlRegions.reduce((s, r) => s + r.similarity, 0) /
            controlRegions.length,
        )
      : 0;

  // Find the recommended duration (where power95 >= 80)
  const recommendedWeeks =
    powerAnalysis.find((p) => p.power95 >= 80)?.weeks ?? 8;

  return (
    <div className="space-y-6">
      {/* Test Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Config Form */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">
            Test Configuration
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1.5">
                Test Name
              </label>
              <input
                type="text"
                value={config.testName}
                onChange={(e) =>
                  setConfig((p) => ({ ...p, testName: e.target.value }))
                }
                placeholder="e.g., Q2 Facebook Geo Test"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1.5">
                Channel
              </label>
              <select
                value={config.channel}
                onChange={(e) =>
                  setConfig((p) => ({ ...p, channel: e.target.value }))
                }
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 appearance-none cursor-pointer"
              >
                <option>Facebook Ads</option>
                <option>Google Search</option>
                <option>Instagram</option>
                <option>YouTube</option>
                <option>TikTok</option>
                <option>TV</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1.5">
                KPI to Measure
              </label>
              <select
                value={config.kpi}
                onChange={(e) =>
                  setConfig((p) => ({ ...p, kpi: e.target.value }))
                }
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 appearance-none cursor-pointer"
              >
                <option>Revenue</option>
                <option>Conversions</option>
                <option>Website Visits</option>
                <option>App Installs</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1.5">
                Test Budget ($)
              </label>
              <input
                type="number"
                value={config.budget}
                onChange={(e) =>
                  setConfig((p) => ({ ...p, budget: Number(e.target.value) }))
                }
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1.5">
                Duration (weeks):{" "}
                <span className="text-brand-primary">
                  {config.durationWeeks}
                </span>
              </label>
              <input
                type="range"
                min={2}
                max={12}
                value={config.durationWeeks}
                onChange={(e) =>
                  setConfig((p) => ({
                    ...p,
                    durationWeeks: Number(e.target.value),
                  }))
                }
                className="w-full accent-[#4a151b]"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>2 wks</span>
                <span>12 wks</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pre-test Diagnostics */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">
            Pre-test Diagnostics
          </h3>
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Shield size={16} className="text-emerald-500" />
                <span className="text-sm font-semibold text-slate-700">
                  Market Similarity Score
                </span>
              </div>
              <div className="text-3xl font-black text-slate-900">
                {avgSimilarity}%
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {avgSimilarity >= 75
                  ? "Good match between treatment & control"
                  : "Consider adjusting region selection"}
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Zap size={16} className="text-amber-500" />
                <span className="text-sm font-semibold text-slate-700">
                  Recommended Duration
                </span>
              </div>
              <div className="text-3xl font-black text-slate-900">
                {recommendedWeeks} weeks
              </div>
              <p className="text-xs text-slate-500 mt-1">
                For 95% confidence at 80% power
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Info size={16} className="text-blue-500" />
                <span className="text-sm font-semibold text-slate-700">
                  Min. Detectable Effect
                </span>
              </div>
              <div className="text-3xl font-black text-slate-900">5.2%</div>
              <p className="text-xs text-slate-500 mt-1">
                Smallest lift detectable with current setup
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
                <div className="text-sm font-bold text-emerald-700">
                  {treatmentRegions.length}
                </div>
                <div className="text-xs text-emerald-600">Treatment</div>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
                <div className="text-sm font-bold text-blue-700">
                  {controlRegions.length}
                </div>
                <div className="text-xs text-blue-600">Control</div>
              </div>
            </div>
          </div>
        </div>

        {/* Power Analysis Chart */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            Power Analysis
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            Statistical power vs. test duration
          </p>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={powerAnalysis}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="weeks"
                tick={{ fontSize: 12 }}
                label={{
                  value: "Weeks",
                  position: "insideBottom",
                  offset: -2,
                  fontSize: 12,
                }}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                domain={[0, 100]}
                label={{
                  value: "Power %",
                  angle: -90,
                  position: "insideLeft",
                  fontSize: 12,
                }}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  fontSize: "13px",
                }}
                formatter={(value: any, name: any) => [ // eslint-disable-line @typescript-eslint/no-explicit-any
                  `${value ?? 0}%`,
                  (String(name ?? "")).replace("power", "α=0."),
                ]}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <ReferenceLine
                y={80}
                stroke="#94a3b8"
                strokeDasharray="5 5"
                label={{ value: "80% power", position: "right", fontSize: 11 }}
              />
              <ReferenceLine
                x={config.durationWeeks}
                stroke="#4a151b"
                strokeDasharray="5 5"
                label={{ value: "Selected", position: "top", fontSize: 11 }}
              />
              <Line
                type="monotone"
                dataKey="power80"
                stroke="#4a151b"
                strokeWidth={2.5}
                dot={false}
                name="α = 0.20"
              />
              <Line
                type="monotone"
                dataKey="power90"
                stroke="#ED1B24"
                strokeWidth={2}
                dot={false}
                name="α = 0.10"
              />
              <Line
                type="monotone"
                dataKey="power95"
                stroke="#F58726"
                strokeWidth={2}
                dot={false}
                name="α = 0.05"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Region Selector */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-1">
          Region Assignment
        </h3>
        <p className="text-sm text-slate-500 mb-6">
          Drag regions between groups or use the arrows. Higher similarity
          scores indicate better control matches.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Treatment */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-sm font-bold text-slate-700">
                Treatment ({treatmentRegions.length})
              </span>
            </div>
            <div className="space-y-2">
              {treatmentRegions.map((region) => (
                <RegionCard
                  key={region.id}
                  region={region}
                  onMoveRight={() => assignRegion(region.id, "unassigned")}
                  showRightArrow
                />
              ))}
              {treatmentRegions.length === 0 && (
                <div className="text-sm text-slate-400 text-center py-8 border-2 border-dashed border-slate-200 rounded-xl">
                  Assign regions here
                </div>
              )}
            </div>
          </div>

          {/* Unassigned */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-slate-400" />
              <span className="text-sm font-bold text-slate-700">
                Unassigned ({unassignedRegions.length})
              </span>
            </div>
            <div className="space-y-2">
              {unassignedRegions.map((region) => (
                <div key={region.id} className="flex items-center gap-1">
                  <button
                    onClick={() => assignRegion(region.id, "treatment")}
                    className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors"
                    title="Move to Treatment"
                  >
                    <ArrowLeft size={14} />
                  </button>
                  <div className="flex-1">
                    <RegionCard region={region} compact />
                  </div>
                  <button
                    onClick={() => assignRegion(region.id, "control")}
                    className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
                    title="Move to Control"
                  >
                    <ArrowRight size={14} />
                  </button>
                </div>
              ))}
              {unassignedRegions.length === 0 && (
                <div className="text-sm text-slate-400 text-center py-8 border-2 border-dashed border-slate-200 rounded-xl">
                  All regions assigned
                </div>
              )}
            </div>
          </div>

          {/* Control */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-sm font-bold text-slate-700">
                Control ({controlRegions.length})
              </span>
            </div>
            <div className="space-y-2">
              {controlRegions.map((region) => (
                <RegionCard
                  key={region.id}
                  region={region}
                  onMoveLeft={() => assignRegion(region.id, "unassigned")}
                  showLeftArrow
                />
              ))}
              {controlRegions.length === 0 && (
                <div className="text-sm text-slate-400 text-center py-8 border-2 border-dashed border-slate-200 rounded-xl">
                  Assign regions here
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Region Card Sub-component
interface RegionCardProps {
  region: GeoRegion;
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
  showLeftArrow?: boolean;
  showRightArrow?: boolean;
  compact?: boolean;
}

const RegionCard = ({
  region,
  onMoveLeft,
  onMoveRight,
  showLeftArrow,
  showRightArrow,
  compact,
}: RegionCardProps) => {
  const groupColor =
    region.group === "treatment"
      ? "border-emerald-200 bg-emerald-50/50"
      : region.group === "control"
        ? "border-blue-200 bg-blue-50/50"
        : "border-slate-200 bg-white";

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl border ${groupColor} transition-all`}
    >
      {showLeftArrow && (
        <button
          onClick={onMoveLeft}
          className="p-1 rounded-lg hover:bg-white text-slate-400 hover:text-slate-600 transition-colors"
        >
          <ArrowLeft size={14} />
        </button>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <MapPin size={14} className="text-slate-400 flex-shrink-0" />
          <span className="text-sm font-semibold text-slate-800 truncate">
            {region.name}
          </span>
          <span
            className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
              region.similarity >= 80
                ? "bg-emerald-100 text-emerald-700"
                : region.similarity >= 65
                  ? "bg-amber-100 text-amber-700"
                  : "bg-red-100 text-red-700"
            }`}
          >
            {region.similarity}%
          </span>
        </div>
        {!compact && (
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Users size={11} /> {(region.population / 1000000).toFixed(1)}M
            </span>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <DollarSign size={11} /> ${(region.avgRevenue / 1000).toFixed(0)}
              K/wk
            </span>
          </div>
        )}
      </div>
      {showRightArrow && (
        <button
          onClick={onMoveRight}
          className="p-1 rounded-lg hover:bg-white text-slate-400 hover:text-slate-600 transition-colors"
        >
          <ArrowRight size={14} />
        </button>
      )}
    </div>
  );
};
