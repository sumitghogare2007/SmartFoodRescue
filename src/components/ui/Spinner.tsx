import { Loader2 } from 'lucide-react';
import { cn } from './GlassCard';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12"
  };

  return (
    <Loader2 
      className={cn(
        "animate-spin text-green-500", 
        sizes[size],
        className
      )} 
    />
  );
}
