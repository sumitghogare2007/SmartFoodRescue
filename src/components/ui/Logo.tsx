import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  textSize?: string;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 32,
  showText = false,
  textSize = 'text-xl',
}) => {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <img
        src="/assets/logo.svg"
        alt="SmartFoodRescue Logo"
        width={size}
        height={size}
        className="shrink-0 object-contain drop-shadow-xs"
      />
      {showText && (
        <span className={`font-bold tracking-tight text-[#1e3a5f] dark:text-emerald-400 ${textSize}`}>
          SmartFoodRescue
        </span>
      )}
    </div>
  );
};

export default Logo;
