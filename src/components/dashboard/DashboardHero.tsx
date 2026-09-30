import React from 'react';
import { Sparkles } from 'lucide-react';

export interface DashboardHeroProps {
  pillText: string;
  titlePrefix: string;
  titleAccent: string;
  titleSuffix?: string;
  subtitle: string;
  statNumber?: string | number;
  statLabel?: string;
  statSubtext?: string;
  progressPercent?: number;
  actions?: React.ReactNode;
}

export const DashboardHero: React.FC<DashboardHeroProps> = ({
  pillText,
  titlePrefix,
  titleAccent,
  titleSuffix = '',
  subtitle,
  statNumber,
  statLabel,
  statSubtext,
  progressPercent = 0,
  actions
}) => {
  return (
    <div className="relative overflow-hidden bg-white/85 dark:bg-slate-900/80 backdrop-blur-xl border border-white/90 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-[0_8px_32px_rgba(18,184,176,0.06)] transition-all">
      {/* Decorative ambient gradient inside the hero */}
      <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-gradient-to-br from-[#12B8B0]/15 to-[#D9F3EF]/30 blur-2xl" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left Headline Area */}
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 bg-[#E1F6F3] dark:bg-teal-950/60 text-[#0F766E] dark:text-teal-300 border border-[#BCE8E2] dark:border-teal-800/40 text-[11px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-full shadow-xs">
            <Sparkles className="w-3 h-3 text-[#12B8B0]" />
            <span>{pillText}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight leading-tight">
            {titlePrefix}{' '}
            <span className="text-[#12B8B0]">{titleAccent}</span>
            {titleSuffix && ` ${titleSuffix}`}
          </h1>

          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
            {subtitle}
          </p>

          {actions && (
            <div className="pt-2 flex flex-wrap items-center gap-3">
              {actions}
            </div>
          )}
        </div>

        {/* Right Frosted Stat Widget (matching screenshot right stat card) */}
        {statNumber !== undefined && (
          <div className="flex-shrink-0 w-full lg:w-72 bg-gradient-to-br from-[#F8FCFB]/90 to-[#EAF7F5]/80 dark:from-slate-800/80 dark:to-slate-800/50 backdrop-blur-md border border-[#D5EFEA] dark:border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-xs">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                  {statLabel || 'Rescue Efficiency'}
                </p>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-slate-100">
                    {statNumber}
                  </span>
                </div>
              </div>

              {progressPercent !== undefined && (
                <div className="text-right">
                  <span className="text-2xl font-black text-[#12B8B0]">
                    {progressPercent}%
                  </span>
                </div>
              )}
            </div>

            {/* Progress bar */}
            {progressPercent !== undefined && (
              <div className="mt-3 w-full bg-slate-200/80 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-[#12B8B0] h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
                />
              </div>
            )}

            {statSubtext && (
              <p className="mt-2.5 text-[11px] text-slate-400 dark:text-slate-400 font-medium">
                {statSubtext}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardHero;
