interface ChannelContributionProps {
  data: Array<{ channel: string; revenue: number; spend: number }>;
}
import { 
  Youtube, 
  Instagram, 
  Search, 
  Music2, 
  Infinity as InfinityIcon, 
  Globe 
} from "lucide-react";

const getChannelIcon = (channel: string) => {
  const c = channel.toLowerCase();
  if (c.includes('youtube')) return <Youtube size={18} className="text-[#FF0000]" />;
  if (c.includes('google') || c.includes('search')) return <Search size={18} className="text-[#4285F4]" />;
  if (c.includes('instagram')) return <Instagram size={18} className="text-[#E4405F]" />;
  if (c.includes('tiktok')) return <Music2 size={18} className="text-[#000000]" />;
  if (c.includes('meta') || c.includes('facebook')) return <InfinityIcon size={18} className="text-[#1877F2]" />;
  return <Globe size={18} className="text-slate-400" />;
};

export const ChannelContribution = ({ data }: ChannelContributionProps) => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
            Channel Impact Heatmap
          </h3>
          <p className="text-slate-500 text-sm">
            Total revenue breakdown by channel source
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          <span className="px-3 py-1.5 bg-slate-100 rounded-md font-medium text-slate-600">
            Absolute
          </span>
          <span className="px-3 py-1.5 bg-white border border-slate-200 rounded-md font-medium text-slate-400">
            Percentage
          </span>
        </div>
      </div>

      <div className="w-full">
        <div className="grid grid-cols-3 gap-4 pb-4 border-b border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
          <span>Channel</span>
          <span className="text-center">Status</span>
          <span className="text-right">Trend</span>
        </div>

        <div className="divide-y divide-slate-50">
          {data.map((item) => (
            <div
              key={item.channel}
              className="grid grid-cols-3 items-center py-5 px-2 group hover:bg-slate-50/50 transition-colors rounded-xl"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  {getChannelIcon(item.channel)}
                </div>
                <span className="font-bold text-slate-900 text-[15px] tracking-tight">{item.channel}</span>
              </div>

              <div className="flex justify-center">
                <span className="px-3 py-1.5 bg-red-500 text-white text-[10px] font-black rounded-lg uppercase tracking-wider shadow-sm">
                  Very High
                </span>
              </div>

              <div className="text-right">
                <span className="text-green-500 font-black text-sm tracking-tight">
                  +10%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
