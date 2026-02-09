import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface IncrementalityChartProps {
  data: any[];
}

const COLORS = ['#871F1E', '#ED1B24', '#F58726', '#FACC00'];

export const IncrementalityChart = ({ data }: IncrementalityChartProps) => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-[400px]">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-900">Incrementality</h3>
        <p className="text-slate-500 text-sm">Paid vs Organic Lift</p>
      </div>
      <ResponsiveContainer width="100%" height="80%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            fill="#8884d8"
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend verticalAlign="bottom" height={36}/>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
