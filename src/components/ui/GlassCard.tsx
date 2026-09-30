import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'stat' | 'mint-hero';
  hover?: boolean;
}

export function GlassCard({ children, className, variant = 'default', hover = false }: GlassCardProps) {
  const baseClasses = "rounded-2xl overflow-hidden transition-all duration-200";
  
  const variants = {
    default: "bg-white/85 dark:bg-slate-900/80 backdrop-blur-md border border-white/80 dark:border-white/10 shadow-[0_4px_20px_-2px_rgba(18,184,176,0.06),0_2px_6px_rgba(0,0,0,0.02)]",
    elevated: "bg-white/95 dark:bg-slate-900/90 backdrop-blur-lg border border-[#D2EBE6] dark:border-white/15 shadow-[0_8px_30px_rgba(18,184,176,0.10)]",
    stat: "bg-white/85 dark:bg-slate-900/80 backdrop-blur-md border border-white/80 dark:border-white/10 shadow-[0_4px_20px_-2px_rgba(18,184,176,0.06)] border-l-4 border-l-[#12B8B0]",
    'mint-hero': "bg-gradient-to-r from-white/95 via-white/90 to-[#EAF7F5]/85 dark:from-slate-900/95 dark:via-slate-900/90 dark:to-[#0F2327]/85 backdrop-blur-lg border border-white/90 dark:border-white/10 shadow-[0_8px_32px_rgba(18,184,176,0.08)] rounded-3xl"
  };

  return (
    <div 
      className={cn(
        baseClasses,
        variants[variant],
        hover && "hover:shadow-[0_8px_30px_rgba(18,184,176,0.12)] hover:border-[#12B8B0]/40 hover:-translate-y-0.5",
        className
      )}
    >
      {children}
    </div>
  );
}

export const Card = GlassCard;

