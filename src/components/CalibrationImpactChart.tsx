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
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <div>
           <h3 className="text-lg font-bold text-slate-900">
             Calibration Impact Analysis
           </h3>
           <p className="text-slate-500 text-xs mt-1">Comparing pre-calibration baseline to optimized results</p>
        </div>
        <div className="flex items-center gap-6 text-xs font-bold">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-[#cbd5e1]"></div> 
            <span className="text-slate-600">Baseline</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-brand-secondary"></div> 
            <span className="text-slate-600">Calibrated</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full border-2 border-slate-900"></div>{" "}
            <span className="text-slate-600">Actuals</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
          barGap={8}
        >
          <defs>
            <linearGradient id="baselineGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#e2e8f0" stopOpacity={1}/>
              <stop offset="95%" stopColor="#cbd5e1" stopOpacity={1}/>
            </linearGradient>
            <linearGradient id="calibratedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#871F1E" stopOpacity={1}/>
              <stop offset="95%" stopColor="#671212" stopOpacity={1}/>
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="4 4"
            vertical={false}
            stroke="#f8fafc"
          />
          <XAxis
            dataKey="channel"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 600 }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 600 }}
            tickFormatter={(value) => `$${(value / 100).toFixed(0)}k`}
          />
          <Tooltip
            cursor={{ fill: '#f8fafc', radius: 4 }}
            contentStyle={{
              backgroundColor: "#0f172a",
              borderRadius: "12px",
              border: "none",
              boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
              padding: "12px 16px",
            }}
            itemStyle={{
              color: "#f8fafc",
              fontSize: "12px",
              fontWeight: 600,
              padding: "2px 0",
            }}
            labelStyle={{
              color: "#94a3b8",
              fontSize: "11px",
              fontWeight: 700,
              marginBottom: "8px",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
            formatter={(value: unknown, name: string) => [
              `$${(Number(value || 0)).toLocaleString()}`,
              name.charAt(0).toUpperCase() + name.slice(1)
            ]}
          />

          <Bar 
            dataKey="baseline" 
            fill="url(#baselineGradient)" 
            radius={[6, 6, 0, 0]} 
            activeBar={{ opacity: 0.8, stroke: '#94a3b8', strokeWidth: 1 }}
          />
          <Bar 
            dataKey="calibrated" 
            fill="url(#calibratedGradient)" 
            radius={[6, 6, 0, 0]} 
            activeBar={{ fill: '#a32a28', stroke: '#871F1E', strokeWidth: 1 }}
          />
          <Bar
            dataKey="actuals"
            fill="transparent"
            stroke="#0f172a"
            strokeWidth={2}
            strokeDasharray="4 2"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
