import { ResponsiveContainer, ComposedChart, Line, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface ForecastChartProps {
  data: any[];
}

export const ForecastChart = ({ data }: ForecastChartProps) => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-[400px]">
      <div className="flex justify-between items-center mb-6">
        <div>
           <h3 className="text-lg font-bold text-slate-900">Revenue Forecast vs Historical</h3>
           <p className="text-slate-500 text-sm">Comparing actuals with ML predicted baseline.</p>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold">
           <div className="flex items-center gap-1.5">
             <div className="w-3 h-3 rounded-full bg-slate-300"></div> Historical
           </div>
           <div className="flex items-center gap-1.5">
             <div className="w-3 h-3 rounded-full bg-brand-primary"></div> Predicted
           </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height="85%">
        <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#871F1E" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#871F1E" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="date" 
            tickFormatter={(date) => {
                if (!(date instanceof Date)) return '';
                return date.toLocaleDateString('en-US', { month: 'short' });
            }}
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748b', fontSize: 12 }}
            dy={10}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748b', fontSize: 12 }}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            formatter={(value: any) => [`$${Number(value || 0).toLocaleString()}`, 'Revenue']}
            labelFormatter={(label) => {
                if (label instanceof Date) return label.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                return '';
            }}
          />
          
          {/* Historical Line */}
          <Line 
            type="monotone" 
            dataKey="revenue" 
            data={data.filter(d => !d.isPredicted)} 
            stroke="#94a3b8" 
            strokeWidth={3} 
            dot={false}
            activeDot={{ r: 6 }}
          />

          {/* Predicted Line (Dashed) */}
          <Line 
            type="monotone" 
            dataKey="revenue" 
            data={data.filter(d => d.isPredicted || d === data.find(i => !i.isPredicted && data[data.indexOf(i)+1]?.isPredicted))} 
            stroke="#871F1E" 
            strokeWidth={3} 
            strokeDasharray="5 5"
            dot={{ r: 4, fill: '#871F1E', strokeWidth: 2, stroke: '#fff' }}
          />

          {/* Predicted Area */}
          <Area
             type="monotone"
             dataKey="revenue"
             data={data.filter(d => d.isPredicted)}
             stroke="none"
             fill="url(#colorPredicted)"
          />

        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
