import { Search, Users, Tv, MonitorPlay } from 'lucide-react';

interface ChannelStatus {
  channel: string;
  value: number;
  status: string; // 'Very High', 'High', 'Med', 'Low'
  trend: string;
}

interface ChannelHeatmapProps {
  data: ChannelStatus[];
}

const getChannelIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('search') || n.includes('google')) return <Search size={16} className="text-blue-500" />;
  if (n.includes('social') || n.includes('facebook') || n.includes('meta')) return <Users size={16} className="text-purple-500" />;
  if (n.includes('tv') || n.includes('ott')) return <Tv size={16} className="text-orange-500" />;
  if (n.includes('display') || n.includes('video')) return <MonitorPlay size={16} className="text-green-500" />;
  return <div className="w-4 h-4 bg-slate-200 rounded-full" />;
};

const getStatusColor = (status: string) => {
    switch (status) {
        case 'Very High': return 'bg-red-400 text-white'; // Closest to brand secondary
        case 'High': return 'bg-red-200 text-red-900';
        case 'Med': return 'bg-orange-100 text-orange-800'; // Brand third-ish
        case 'Low': return 'bg-slate-100 text-slate-600';
        default: return 'bg-slate-100 text-slate-600';
    }
};

export const ChannelHeatmap = ({ data }: ChannelHeatmapProps) => {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-sm">
        <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-bold text-slate-900">Channel Impact Heatmap</h3>
            <button className="text-brand-primary text-sm font-bold hover:underline">View Full Breakdown</button>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                        <th className="pb-4 pl-4">Channel</th>
                        <th className="pb-4">Status</th>
                        <th className="pb-4 text-right pr-4">Trend</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {data.map((item, idx) => (
                        <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                            <td className="py-4 pl-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                                        {getChannelIcon(item.channel)}
                                    </div>
                                    <span className="font-semibold text-slate-700">{item.channel}</span>
                                </div>
                            </td>
                            <td className="py-4">
                                <span className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wide ${getStatusColor(item.status)}`}>
                                    {item.status}
                                </span>
                            </td>
                            <td className="py-4 pr-4 text-right">
                                <div className="flex items-center justify-end gap-1 text-green-600 font-bold text-sm">
                                    {item.trend}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
  );
};
