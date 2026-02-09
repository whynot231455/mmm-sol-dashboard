import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";

interface ResidualPlotProps {
  data: Array<{ predicted: number; residual: number }>;
}

export const ResidualPlot = ({ data }: ResidualPlotProps) => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200">
      <h3 className="text-lg font-bold text-slate-900 mb-4">Residual Plot</h3>

      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            type="number"
            dataKey="predicted"
            name="Predicted Value"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748b", fontSize: 12 }}
            label={{
              value: "Predicted Value",
              position: "bottom",
              fill: "#64748b",
              fontSize: 11,
            }}
          />
          <YAxis
            type="number"
            dataKey="residual"
            name="Residual"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748b", fontSize: 12 }}
            label={{
              value: "Residual",
              angle: -90,
              position: "insideLeft",
              fill: "#64748b",
              fontSize: 11,
            }}
          />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            contentStyle={{
              borderRadius: "12px",
              border: "none",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            }}
            formatter={(value: number | string | undefined) =>
              Number(value || 0).toFixed(2)
            }
          />
          <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={2} />

          <Scatter data={data} fill="#64748b" fillOpacity={0.6} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};
