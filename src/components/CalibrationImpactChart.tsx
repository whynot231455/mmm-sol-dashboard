import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface CalibrationImpactChartProps {
  data: Array<{
    channel: string;
    baseline: number;
    calibrated: number;
    actuals: number;
  }>;
}

export const CalibrationImpactChart = ({
  data,
}: CalibrationImpactChartProps) => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-slate-900">
          Calibration Impact Analysis
        </h3>
        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-slate-300"></div> Baseline
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-brand-primary"></div> Calibrated
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full border-2 border-slate-600"></div>{" "}
            Actuals
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#f1f5f9"
          />
          <XAxis
            dataKey="channel"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748b", fontSize: 12 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748b", fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "12px",
              border: "none",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            }}
            formatter={(value: number | string | undefined) =>
              Number(value || 0).toFixed(1)
            }
          />

          <Bar dataKey="baseline" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
          <Bar dataKey="calibrated" fill="#871F1E" radius={[4, 4, 0, 0]} />
          <Bar
            dataKey="actuals"
            fill="transparent"
            stroke="#1e293b"
            strokeWidth={2}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
