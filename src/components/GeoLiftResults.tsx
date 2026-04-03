import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import {
  TrendingUp,
  DollarSign,
  Target,
  CheckCircle2,
  ArrowUpRight,
  Download,
} from "lucide-react";
import type {
  LiftResult,
  ChannelComparison,
  CounterfactualPoint,
} from "../hooks/useGeoLiftData";

interface GeoLiftResultsProps {
  liftResult: LiftResult;
  channelComparison: ChannelComparison[];
  counterfactualData: CounterfactualPoint[];
  onApplyToModel?: () => void;
}

export const GeoLiftResults = ({
  liftResult,
  channelComparison,
  counterfactualData,
  onApplyToModel,
}: GeoLiftResultsProps) => {
  // Find the test start index (where liftArea > 0)
  const testStartIndex = counterfactualData.findIndex((d) => d.liftArea > 0);
  const testStartDate =
    testStartIndex >= 0 ? counterfactualData[testStartIndex].date : null;

  return (
    <div className="space-y-6">
      {/* Lift Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-emerald-500" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Estimated Lift
            </span>
          </div>
          <div className="text-3xl font-black text-emerald-600">
            +{liftResult.liftPercent}%
          </div>
          <p className="text-xs text-slate-500 mt-1">
            CI: [{liftResult.confidenceInterval[0]}%,{" "}
            {liftResult.confidenceInterval[1]}%]
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={16} className="text-blue-500" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Incremental Revenue
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900">
            ${(liftResult.incrementalRevenue / 1000).toFixed(1)}K
          </div>
          <p className="text-xs text-slate-500 mt-1">
            On ${(liftResult.testSpend / 1000).toFixed(0)}K spend
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-2">
            <Target size={16} className="text-purple-500" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Incremental ROAS
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900">
            {liftResult.incrementalROAS}x
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Revenue per dollar spent
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={16} className="text-emerald-500" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              P-Value
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900">
            {liftResult.pValue}
          </div>
          <p className="text-xs mt-1">
            {liftResult.pValue < 0.05 ? (
              <span className="text-emerald-600 font-semibold">
                ✓ Statistically significant
              </span>
            ) : (
              <span className="text-amber-600 font-semibold">
                ⚠ Not significant
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Counterfactual Chart */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Counterfactual Analysis
            </h3>
            <p className="text-sm text-slate-500">
              Actual performance vs. predicted (no campaign) scenario
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">
            <Download size={14} />
            Export
          </button>
        </div>
        <div className="mt-4">
          <ResponsiveContainer width="100%" height={380}>
            <AreaChart data={counterfactualData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                tickFormatter={(d: string) => {
                  const date = new Date(d);
                  return `${date.getMonth() + 1}/${date.getDate()}`;
                }}
                interval={6}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}K`}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  fontSize: "13px",
                }}
                formatter={(value: any, name: any) => [ // eslint-disable-line @typescript-eslint/no-explicit-any
                  `$${(Number(value ?? 0) / 1000).toFixed(1)}K`,
                  name,
                ]}
                labelFormatter={(label: unknown) => {
                  const d = new Date(String(label));
                  return d.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              {testStartDate && (
                <ReferenceLine
                  x={testStartDate}
                  stroke="#4a151b"
                  strokeDasharray="5 5"
                  label={{
                    value: "Test Start",
                    position: "top",
                    fontSize: 11,
                    fill: "#4a151b",
                  }}
                />
              )}
              <Area
                type="monotone"
                dataKey="counterfactual"
                stroke="#94a3b8"
                fill="#f1f5f9"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Counterfactual"
              />
              <Area
                type="monotone"
                dataKey="actual"
                stroke="#059669"
                fill="#d1fae5"
                strokeWidth={2.5}
                fillOpacity={0.4}
                name="Actual"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex items-center gap-6 px-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-emerald-500" />
            <span className="text-xs text-slate-600">
              Actual (with campaign)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-slate-400 border-dashed border-t-2 border-slate-400" />
            <span className="text-xs text-slate-600">
              Counterfactual (no campaign)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-emerald-100 border border-emerald-300 rounded" />
            <span className="text-xs text-slate-600">
              Incremental lift area
            </span>
          </div>
        </div>
      </div>

      {/* Channel Comparison: GeoLift vs MMM */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            GeoLift vs. MMM ROAS
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            Compare experiment-based vs. model-based ROAS estimates
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={channelComparison}
              layout="vertical"
              barCategoryGap="20%"
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f1f5f9"
                horizontal={false}
              />
              <XAxis
                type="number"
                tick={{ fontSize: 12 }}
                tickFormatter={(v: number) => `${v}x`}
              />
              <YAxis
                type="category"
                dataKey="channel"
                tick={{ fontSize: 12 }}
                width={110}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  fontSize: "13px",
                }}
                formatter={(value: any, name: any) => [ // eslint-disable-line @typescript-eslint/no-explicit-any
                  `${value ?? 0}x`,
                  name,
                ]}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Bar
                dataKey="geoLiftROAS"
                fill="#059669"
                radius={[0, 4, 4, 0]}
                name="GeoLift ROAS"
              />
              <Bar
                dataKey="mmmROAS"
                fill="#3b82f6"
                radius={[0, 4, 4, 0]}
                name="MMM ROAS"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Delta Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            Model Calibration Delta
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            Difference between GeoLift and MMM estimates
          </p>
          <div className="space-y-3">
            {channelComparison.map((ch) => (
              <div
                key={ch.channel}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"
              >
                <div>
                  <div className="text-sm font-semibold text-slate-800">
                    {ch.channel}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    GeoLift: {ch.geoLiftROAS}x · MMM: {ch.mmmROAS}x
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span
                    className={`text-sm font-bold ${
                      ch.delta > 0 ? "text-emerald-600" : "text-red-500"
                    }`}
                  >
                    {ch.delta > 0 ? "+" : ""}
                    {ch.delta}%
                  </span>
                  {ch.delta > 0 && (
                    <ArrowUpRight size={14} className="text-emerald-500" />
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={onApplyToModel}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#4a151b] hover:bg-[#3a1015] text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-red-100"
            >
              <Target size={16} />
              Apply to Calibration
            </button>
            <button className="flex items-center justify-center gap-2 px-4 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
              <Download size={16} />
              Export Results
            </button>
          </div>
        </div>
      </div>

      {/* Statistical Detail */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">
          Statistical Summary
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Test Type
            </div>
            <div className="text-sm font-semibold text-slate-800">
              Geo-based Incrementality
            </div>
          </div>
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Method
            </div>
            <div className="text-sm font-semibold text-slate-800">
              Synthetic Control
            </div>
          </div>
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Confidence Level
            </div>
            <div className="text-sm font-semibold text-slate-800">95%</div>
          </div>
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Significance
            </div>
            <div className="text-sm font-semibold text-emerald-700">
              {liftResult.pValue < 0.05
                ? "Significant (p < 0.05)"
                : "Not Significant"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
