import React from 'react';
import { cn } from './GlassCard';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'green' | 'amber' | 'red' | 'blue' | 'gray' | 'purple' | 'teal' | 'indigo';
  size?: 'sm' | 'md';
  pulse?: boolean;
  className?: string;
}

export function Badge({ children, variant = 'gray', size = 'sm', pulse = false, className }: BadgeProps) {
  const variants = {
    green: "bg-green-50 text-green-800 border-green-200",
    amber: "bg-amber-50 text-amber-800 border-amber-200",
    red: "bg-red-50 text-red-800 border-red-200",
    blue: "bg-blue-50 text-blue-800 border-blue-200",
    gray: "bg-gray-100 text-gray-800 border-gray-200",
    purple: "bg-purple-50 text-purple-800 border-purple-200",
    teal: "bg-teal-50 text-teal-800 border-teal-200",
    indigo: "bg-indigo-50 text-indigo-800 border-indigo-200"
  };

  const sizes = {
    sm: "px-2.5 py-0.5 text-xs",
    md: "px-3 py-1 text-sm"
  };

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center font-medium border rounded-full",
        variants[variant],
        sizes[size],
        pulse && `animate-pulse`,
        className
      )}
    >
      {pulse && (
        <span className={cn(
          "w-1.5 h-1.5 rounded-full mr-1.5",
          variant === 'red' ? 'bg-red-400' : 'bg-green-400'
        )} />
      )}
      {children}
    </span>
  );
}
