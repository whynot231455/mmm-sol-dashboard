interface ChannelContributionProps {
  data: Array<{ channel: string; revenue: number; spend: number }>;
}
import { formatSmartCurrency } from "../lib/formatters";

export const ChannelContribution = ({ data }: ChannelContributionProps) => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            Channel Contribution
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

      <div className="space-y-6">
        {data.map((item) => (
          <div
            key={item.channel}
            className="flex items-center justify-between group"
          >
            <div className="flex items-center gap-4 w-1/3">
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 font-bold text-xs uppercase">
                {item.channel.substring(0, 2)}
              </div>
              <span className="font-medium text-slate-700">{item.channel}</span>
            </div>

            <div className="flex-1 px-4">
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-brand-secondary rounded-full"
                  style={{
                    width: `${(item.revenue / Math.max(...data.map((d) => d.revenue))) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="w-24 text-right">
              <span className="font-bold text-slate-900 block">
                {formatSmartCurrency(item.revenue)}
              </span>
              <span className="text-xs text-slate-400">Revenue</span>
            </div>

            <div className="w-24 text-right">
              <span className="font-bold text-slate-900 block">
                {(item.revenue / item.spend).toFixed(1)}x
              </span>
              <span className="text-xs text-slate-400">ROAS</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
