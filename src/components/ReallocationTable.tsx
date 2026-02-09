import { formatSmartCurrency } from '../lib/formatters';
import { Download } from 'lucide-react';

interface ReallocationItem {
  channel: string;
  spend: number;
  proposedSpend: number;
  delta: number;
  impact: string;
}

interface ReallocationTableProps {
  data: ReallocationItem[];
}

export const ReallocationTable = ({ data }: ReallocationTableProps) => {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-sm">
      <div className="flex justify-between items-center mb-10">
        <h3 className="text-xl font-bold text-slate-900 tracking-tight">Reallocation Suggestions</h3>
        <button className="flex items-center gap-2 text-slate-500 text-xs font-bold hover:text-slate-700 transition-colors uppercase tracking-wider">
           <Download size={14} />
           Export CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50">
              <th className="pb-5 pl-4">Channel</th>
              <th className="pb-5">Current Spend</th>
              <th className="pb-5">Proposed Spend</th>
              <th className="pb-5">Delta ($)</th>
              <th className="pb-5 pr-4">Impact</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {data.map((item, idx) => (
              <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                <td className="py-5 pl-4 flex items-center gap-3">
                   <div className="w-2 h-2 rounded-full bg-blue-500" />
                   <span className="font-bold text-slate-700">{item.channel}</span>
                </td>
                <td className="py-5">
                   <span className="font-semibold text-slate-500">{formatSmartCurrency(item.spend)}</span>
                </td>
                <td className="py-5">
                   <span className="font-black text-slate-900">{formatSmartCurrency(item.proposedSpend)}</span>
                </td>
                <td className="py-5">
                   <span className={`font-bold ${item.delta >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {item.delta >= 0 ? '+' : ''}{formatSmartCurrency(item.delta)}
                   </span>
                </td>
                <td className="py-5 pr-4">
                   <div className="w-32">
                      <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1.5 uppercase">
                         <span>{item.impact}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                         <div 
                           className={`h-full rounded-full transition-all duration-500 ${item.impact.includes('High') ? 'bg-green-500' : item.impact.includes('Med') ? 'bg-brand-third' : 'bg-slate-300'}`}
                           style={{ width: item.impact.includes('High') ? '85%' : item.impact.includes('Med') ? '50%' : '20%' }}
                        />
                      </div>
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
