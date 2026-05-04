import React, { useState } from 'react';
import { formatSmartCurrency } from "../lib/formatters";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ChannelContributionProps {
  data: Array<{ channel: string; revenue: number; spend: number }>;
}

export const ChannelContribution = React.memo(({ data }: ChannelContributionProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Show top 10 by default, or all if expanded
  const visibleData = isExpanded ? data : data.slice(0, 10);
  const hasMore = data.length > 10;

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            Channel Contribution
          </h3>
          <p className="text-slate-500 text-sm">
            Total revenue breakdown by channel source ({data.length} sources)
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
        {visibleData.map((item) => (
          <div
            key={item.channel}
            className="flex items-center justify-between group"
          >
            <div className="flex items-center gap-4 w-1/3">
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 font-bold text-xs uppercase">
                {item.channel.substring(0, 2)}
              </div>
              <span className="font-medium text-slate-700 truncate">{item.channel}</span>
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
                {(item.revenue / (item.spend || 1)).toFixed(1)}x
              </span>
              <span className="text-xs text-slate-400">ROAS</span>
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full mt-8 py-3 border-t border-slate-50 text-sm font-bold text-slate-500 hover:text-brand-secondary flex items-center justify-center gap-2 transition-colors"
        >
          {isExpanded ? (
            <>
              Show Less <ChevronUp size={16} />
            </>
          ) : (
            <>
              Show {data.length - 10} More Sources <ChevronDown size={16} />
            </>
          )}
        </button>
      )}
    </div>
  );
});

ChannelContribution.displayName = 'ChannelContribution';
