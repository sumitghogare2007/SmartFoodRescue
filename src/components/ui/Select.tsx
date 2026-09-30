import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from './GlassCard';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'placeholder'> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, required, placeholder, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {label}
            {required && <span className="text-red-600 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={cn(
              "w-full bg-white/90 dark:bg-slate-800/90 border border-[#D2EBE6] dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 text-sm shadow-xs appearance-none",
              "focus:outline-none focus:ring-2 focus:ring-[#12B8B0]/25 focus:border-[#12B8B0] transition-colors",
              "px-3.5 py-2.5 pr-10",
              error && "border-red-500 focus:ring-red-500 focus:border-red-500",
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled hidden className="text-gray-400">
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value} className="text-gray-900">
                {option.label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-400">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
        {error && (
          <p className="mt-1.5 text-xs text-red-600">{error}</p>
        )}
      </div>
    );
  }
);
Select.displayName = 'Select';
