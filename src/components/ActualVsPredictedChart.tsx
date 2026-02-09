import { ResponsiveContainer, ComposedChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { formatSmartCurrency } from '../lib/formatters';

interface ActualVsPredictedChartProps {
  data: Array<{ date: Date; actual: number; predicted: number }>;
}

export const ActualVsPredictedChart = ({ data }: ActualVsPredictedChartProps) => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200">
      <h3 className="text-lg font-bold text-slate-900 mb-4">Actual vs. Predicted (Holdout)</h3>
      
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="date" 
            tickFormatter={(date) => {
              if (!(date instanceof Date)) return '';
              return `Week ${Math.ceil(date.getDate() / 7)}`;
            }}
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748b', fontSize: 12 }}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748b', fontSize: 12 }}
            tickFormatter={(value) => formatSmartCurrency(value)}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            formatter={(value: any) => formatSmartCurrency(Number(value || 0))}
            labelFormatter={(label) => {
              if (label instanceof Date) return label.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              return '';
            }}
          />
          <Legend 
            wrapperStyle={{ fontSize: '12px', fontWeight: 600 }}
            iconType="circle"
          />
          
          <Line 
            type="monotone" 
            dataKey="actual"
            name="Actual"
            stroke="#1e293b" 
            strokeWidth={3} 
            dot={{ r: 4, fill: '#1e293b' }}
          />
          
          <Line 
            type="monotone" 
            dataKey="predicted"
            name="Predicted"
            stroke="#3b82f6" 
            strokeWidth={3} 
            dot={{ r: 4, fill: '#3b82f6' }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
