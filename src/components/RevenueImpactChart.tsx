import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { formatSmartCurrency } from '../lib/formatters';

interface RevenueImpactChartProps {
  data: any[];
}

export const RevenueImpactChart = ({ data }: RevenueImpactChartProps) => {
  return (
    <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm h-[450px]">
       <div className="flex justify-between items-center mb-8">
        <div>
           <h3 className="text-xl font-bold text-slate-900 tracking-tight">Revenue Impact Over Time</h3>
           <p className="text-slate-500 text-sm mt-1">Comparing Current Allocation vs. Optimized Scenario</p>
        </div>
        <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                <div className="w-3 h-3 rounded-full bg-slate-200" />
                Baseline
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-brand-primary">
                <div className="w-3 h-3 rounded-full bg-brand-primary" />
                Optimized
            </div>
            <select className="ml-4 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold text-slate-600 outline-none">
                <option>Next 30 Days</option>
                <option>Next 90 Days</option>
            </select>
        </div>
      </div>

      <div className="relative h-[300px] w-full mt-4">
        {/* Mock Badge for Peak ROI */}
        <div className="absolute top-0 left-1/4 z-10 bg-white border border-slate-100 px-3 py-1.5 rounded-lg shadow-sm text-[10px] font-bold text-slate-500 flex items-center gap-2">
            Peak ROI: Oct 15
        </div>

        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                    dy={10}
                />
                <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                    tickFormatter={(val) => formatSmartCurrency(val)}
                />
                <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(val: any) => [formatSmartCurrency(val), 'Revenue']}
                />
                <Bar dataKey="baseline" fill="#f1f5f9" radius={[4, 4, 0, 0]} barSize={40} />
                <Bar dataKey="optimized" radius={[4, 4, 0, 0]} barSize={40}>
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.optimized > entry.baseline ? '#871F1E' : '#94a3b8'} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
