import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from './GlassCard';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
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
  const baseClasses = "inline-flex items-center justify-center rounded-md font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-[#166534] text-white shadow-sm hover:bg-[#14532d] focus:ring-[#166534]",
    secondary: "bg-white text-gray-700 border border-gray-300 shadow-sm hover:bg-gray-50 focus:ring-[#166534]",
    danger: "bg-red-600 text-white shadow-sm hover:bg-red-700 focus:ring-red-500",
    ghost: "text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-transparent"
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
