import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from './GlassCard';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'mint' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  fullWidth,
  icon,
  ...props
}: ButtonProps) {
  const baseClasses = "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-[#12B8B0] text-white shadow-xs shadow-[#12B8B0]/25 hover:bg-[#0EA29B] focus:ring-[#12B8B0] active:scale-[0.99]",
    secondary: "bg-white/90 dark:bg-slate-800/90 text-[#0F766E] dark:text-teal-300 border border-[#BCE8E2] dark:border-slate-700 shadow-xs hover:bg-[#EAF7F5] dark:hover:bg-slate-800 focus:ring-[#12B8B0]",
    mint: "bg-[#E1F6F3] dark:bg-teal-950/40 text-[#0F766E] dark:text-teal-300 border border-[#BCE8E2] dark:border-teal-800/60 hover:bg-[#D4F3ED] focus:ring-[#12B8B0]",
    danger: "bg-rose-600 text-white shadow-xs hover:bg-rose-700 focus:ring-rose-500",
    ghost: "text-slate-600 dark:text-slate-300 hover:text-[#0F766E] dark:hover:text-teal-300 hover:bg-[#EAF7F5]/70 dark:hover:bg-slate-800/60 border border-transparent"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-6 py-3 text-base gap-2.5"
  };

  return (
    <button
      disabled={disabled || loading}
      className={cn(
        baseClasses,
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {!loading && icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </button>
  );
}
