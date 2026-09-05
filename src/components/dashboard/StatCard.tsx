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

export function StatCard({ title, value, icon, trend, color = 'green', loading }: StatCardProps) {
  const iconContainerColors = {
    green: "text-green-700 bg-green-50 border border-green-200",
    teal: "text-teal-700 bg-teal-50 border border-teal-200",
    blue: "text-blue-700 bg-blue-50 border border-blue-200",
    amber: "text-amber-700 bg-amber-50 border border-amber-200",
    red: "text-red-700 bg-red-50 border border-red-200",
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-gray-500 text-sm font-medium mb-1 truncate">{title}</p>
          <div className="flex items-baseline gap-2">
            {loading ? (
              <Spinner size="sm" className="mt-2" />
            ) : (
              <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
            )}
          </div>
        </div>
        <div className={`p-3 rounded-lg flex-shrink-0 ml-3 ${iconContainerColors[color]}`}>
          <div className="w-6 h-6 flex items-center justify-center">
            {icon}
          </div>
        </div>
      </div>

      {trend && !loading && (
        <div className="mt-4 flex items-center gap-2 text-xs">
          <span className={`flex items-center font-medium ${trend.value >= 0 ? 'text-green-700' : 'text-red-600'}`}>
            {trend.value >= 0 ? <TrendingUp className="w-3.5 h-3.5 mr-1" /> : <TrendingDown className="w-3.5 h-3.5 mr-1" />}
            {Math.abs(trend.value)}%
          </span>
          <span className="text-gray-500">{trend.label}</span>
        </div>
      )}
    </div>
  );
}

export default StatCard;
