import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'stat';
  hover?: boolean;
}

export function GlassCard({ children, className, variant = 'default', hover = false }: GlassCardProps) {
  const baseClasses = "rounded-lg border border-gray-200 bg-white overflow-hidden";
  
  const variants = {
    default: "shadow-sm",
    elevated: "shadow-md border-gray-300",
    stat: "shadow-sm border-l-4 border-l-[#166534]"
  };

  return (
    <div 
      className={cn(
        baseClasses,
        variants[variant],
        hover && "transition-shadow duration-150 hover:shadow-md",
        className
      )}
    >
      {children}
    </div>
  );
}

export const Card = GlassCard;

