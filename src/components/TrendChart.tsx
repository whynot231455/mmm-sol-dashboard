import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatSmartCurrency } from "../lib/formatters";

interface TrendChartProps {
  data: Array<{ date: string | Date; spend: number; revenue: number }>;
}

export const TrendChart = ({ data }: TrendChartProps) => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-[400px]">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-900">
          Spend vs Revenue Trend
        </h3>
        <p className="text-slate-500 text-sm">Performance over time</p>
      </div>
      <ResponsiveContainer width="100%" height="90%">
        <ComposedChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
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
            tick={{ fill: "#64748b", fontSize: 12 }}
            dy={10}
            minTickGap={30}
          />
          <YAxis
            yAxisId="left"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748b", fontSize: 12 }}
            tickFormatter={(value) => formatSmartCurrency(value)}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748b", fontSize: 12 }}
            tickFormatter={(value) => formatSmartCurrency(value)}
          />
          <Tooltip
            formatter={(value: number | string | undefined) => [
              formatSmartCurrency(Number(value || 0)),
            ]}
            contentStyle={{
              backgroundColor: "#fff",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            }}
          />
          <Bar
            yAxisId="left"
            dataKey="spend"
            barSize={20}
            fill="#878585"
            radius={[4, 4, 0, 0]}
            name="Spend"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="revenue"
            stroke="#871F1E"
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 6, strokeWidth: 0 }}
            name="Revenue"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
