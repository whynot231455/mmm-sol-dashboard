import { TrendingUp, TrendingDown } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface KPICardProps {
  label: string;
  value: string;
  trend?: string;
  trendDirection?: 'up' | 'down';
  icon: React.ReactNode;
}

export const KPICard = ({ label, value, trend, trendDirection, icon }: KPICardProps) => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-slate-50 rounded-xl text-brand-primary">
          {icon}
        </div>
        {trend && (
          <div className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold",
            trendDirection === 'up' 
              ? "bg-green-50 text-green-600" 
              : "bg-red-50 text-red-600"
          )}>
            {trendDirection === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {trend}
          </div>
        )}
      </div>
      <div>
        <p className="text-slate-500 text-sm font-medium mb-1">{label}</p>
        <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{value}</h3>
      </div>
    </div>
  );
};
