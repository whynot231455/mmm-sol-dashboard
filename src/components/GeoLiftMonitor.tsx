import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Activity,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import type {
  MonitorDataPoint,
  RegionPerformance,
  TestConfig,
} from "../hooks/useGeoLiftData";
import { formatCurrency } from "../lib/formatters";

interface GeoLiftMonitorProps {
  monitorData: MonitorDataPoint[];
  regionPerformance: RegionPerformance[];
  testConfig: TestConfig;
}

export const GeoLiftMonitor = ({
  monitorData,
  regionPerformance,
  testConfig,
}: GeoLiftMonitorProps) => {
  const statusConfig = {
    draft: {
      color: "bg-slate-100 text-slate-600",
      icon: <Clock size={16} />,
      label: "Draft",
    },
    scheduled: {
      color: "bg-amber-100 text-amber-700",
      icon: <Clock size={16} />,
      label: "Scheduled",
    },
    active: {
      color: "bg-emerald-100 text-emerald-700",
      icon: <Activity size={16} />,
      label: "Active",
    },
    completed: {
      color: "bg-blue-100 text-blue-700",
      icon: <CheckCircle2 size={16} />,
      label: "Completed",
    },
  };

  const status = statusConfig[testConfig.status];

  // Calculate progress
  const startDate = new Date(testConfig.startDate);
  const endDate = new Date(testConfig.endDate);
  const now = new Date();
  const totalDuration = endDate.getTime() - startDate.getTime();
  const elapsed = Math.min(now.getTime() - startDate.getTime(), totalDuration);
  const progressPercent = Math.max(
    0,
    Math.min(100, Math.round((elapsed / totalDuration) * 100)),
  );

  // Calculate cumulative lift from monitor data
  const treatmentTotal = monitorData.reduce((s, d) => s + d.treatment, 0);
  const controlTotal = monitorData.reduce((s, d) => s + d.control, 0);
  const cumulativeLift =
    controlTotal > 0
      ? (((treatmentTotal - controlTotal) / controlTotal) * 100).toFixed(1)
      : "0";

  // Weekly aggregated data for the chart
  const weeklyData: { week: string; treatment: number; control: number }[] = [];
  for (let w = 0; w < 8; w++) {
    const weekSlice = monitorData.slice(w * 7, (w + 1) * 7);
    if (weekSlice.length > 0) {
      weeklyData.push({
        week: `Wk ${w + 1}`,
        treatment: Math.round(
          weekSlice.reduce((s, d) => s + d.treatment, 0) / weekSlice.length,
        ),
        control: Math.round(
          weekSlice.reduce((s, d) => s + d.control, 0) / weekSlice.length,
        ),
      });
    }
  }

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {testConfig.testName}
            </h3>
            <p className="text-sm text-slate-500">
              {testConfig.channel} · {testConfig.kpi} · $
              {testConfig.budget.toLocaleString()} budget
            </p>
          </div>
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${status.color}`}
          >
            {status.icon}
            {status.label}
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">
              {testConfig.startDate} → {testConfig.endDate}
            </span>
            <span className="font-bold text-slate-700">{progressPercent}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5">
            <div
              className="bg-[#4a151b] h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>
              Week{" "}
              {Math.ceil((progressPercent / 100) * testConfig.durationWeeks)} of{" "}
              {testConfig.durationWeeks}
            </span>
            <span>{testConfig.durationWeeks} week test</span>
          </div>
        </div>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-emerald-500" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Cumulative Lift
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {cumulativeLift}%
          </div>
          <p className="text-xs text-emerald-600 mt-1">
            ↑ Treatment vs Control
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={16} className="text-blue-500" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Incremental Rev.
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900">
            ${Math.round((treatmentTotal - controlTotal) / 1000)}K
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Est. incremental revenue
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-2">
            <Activity size={16} className="text-purple-500" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Treatment Avg.
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900">
            ${Math.round(treatmentTotal / monitorData.length / 1000)}K
          </div>
          <p className="text-xs text-slate-500 mt-1">Daily avg. revenue</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={16} className="text-amber-500" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Confidence
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900">87%</div>
          <p className="text-xs text-slate-500 mt-1">
            Current statistical confidence
          </p>
        </div>
      </div>

      {/* Treatment vs Control Chart */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-1">
          Treatment vs. Control
        </h3>
        <p className="text-sm text-slate-500 mb-4">
          Weekly average daily revenue by group
        </p>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="week" tick={{ fontSize: 12 }} />
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
              formatter={(value: number | undefined) => [
                `$${((value ?? 0) / 1000).toFixed(1)}K`,
              ]}
            />
            <Legend wrapperStyle={{ fontSize: "12px" }} />
            <Line
              type="monotone"
              dataKey="treatment"
              stroke="#059669"
              strokeWidth={2.5}
              dot={{ fill: "#059669", r: 4 }}
              name="Treatment"
            />
            <Line
              type="monotone"
              dataKey="control"
              stroke="#3b82f6"
              strokeWidth={2.5}
              dot={{ fill: "#3b82f6", r: 4 }}
              name="Control"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Region Performance Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-1">
          Region Performance
        </h3>
        <p className="text-sm text-slate-500 mb-4">
          Per-region breakdown of test metrics
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Region
                </th>
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Group
                </th>
                <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Spend
                </th>
                <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Lift %
                </th>
              </tr>
            </thead>
            <tbody>
              {regionPerformance.map((rp, i) => (
                <tr
                  key={rp.region}
                  className={
                    i < regionPerformance.length - 1
                      ? "border-b border-slate-50"
                      : ""
                  }
                >
                  <td className="py-3 px-4 font-semibold text-slate-800">
                    {rp.region}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded-full ${
                        rp.group === "treatment"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {rp.group}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-slate-700">
                    {formatCurrency(rp.revenue, true)}
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-slate-700">
                    {rp.spend > 0 ? formatCurrency(rp.spend, true) : "—"}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {rp.lift > 0 ? (
                      <span className="text-emerald-600 font-bold">
                        +{rp.lift}%
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
