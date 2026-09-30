import { TrendingUp, TrendingDown } from 'lucide-react';
import { Spinner } from '../ui/Spinner';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: number; label: string };
  color?: 'green' | 'teal' | 'blue' | 'amber' | 'red';
  loading?: boolean;
}

export function StatCard({ title, value, icon, trend, color = 'teal', loading }: StatCardProps) {
  const iconContainerColors = {
    teal: "text-[#12B8B0] bg-[#EAF7F5] dark:bg-teal-950/60 border border-[#BCE8E2] dark:border-teal-800/50",
    green: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/50",
    blue: "text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800/50",
    amber: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/50",
    red: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/50",
  };

  return (
    <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-5 shadow-[0_4px_20px_-2px_rgba(18,184,176,0.06)] border border-white/80 dark:border-white/10 hover:shadow-[0_8px_30px_rgba(18,184,176,0.12)] hover:border-[#12B8B0]/30 hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1 truncate">{title}</p>
          <div className="flex items-baseline gap-2">
            {loading ? (
              <Spinner size="sm" className="mt-2 text-[#12B8B0]" />
            ) : (
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</h3>
            )}
          </div>
        </div>
        <div className={`p-3 rounded-xl flex-shrink-0 ml-3 shadow-xs ${iconContainerColors[color]}`}>
          <div className="w-5 h-5 flex items-center justify-center">
            {icon}
          </div>
        </div>
      </div>

      {trend && !loading && (
        <div className="mt-4 flex items-center gap-2 text-xs">
          <span className={`flex items-center font-semibold px-1.5 py-0.5 rounded-md ${
            trend.value >= 0 
              ? 'text-[#0F766E] dark:text-teal-300 bg-[#E1F6F3] dark:bg-teal-950/60' 
              : 'text-rose-600 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50'
          }`}>
            {trend.value >= 0 ? <TrendingUp className="w-3.5 h-3.5 mr-1" /> : <TrendingDown className="w-3.5 h-3.5 mr-1" />}
            {Math.abs(trend.value)}%
          </span>
          <span className="text-slate-400 dark:text-slate-400">{trend.label}</span>
        </div>
      )}
    </div>
  );
}

export default StatCard;
