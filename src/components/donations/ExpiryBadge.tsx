import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { Badge } from '../ui/Badge';

export interface ExpiryBadgeProps {
  expiryTime: string; // ISO string
  showIcon?: boolean;
}

export function ExpiryBadge({ expiryTime, showIcon = true }: ExpiryBadgeProps) {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; expired: boolean }>({
    hours: 0, minutes: 0, expired: false
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(expiryTime).getTime() - new Date().getTime();
      
      if (difference <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, expired: true });
        return;
      }

      const hours = Math.floor((difference / (1000 * 60 * 60)));
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      
      setTimeLeft({ hours, minutes, expired: false });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [expiryTime]);

  if (timeLeft.expired) {
    return (
      <Badge variant="gray" className="gap-1 font-semibold">
        {showIcon && <Clock className="w-3 h-3" />}
        EXPIRED
      </Badge>
    );
  }

  const isUrgent = timeLeft.hours < 1;
  const isWarning = timeLeft.hours >= 1 && timeLeft.hours < 4;
  
  let variant: 'green' | 'amber' | 'red' = 'green';
  if (isUrgent) variant = 'red';
  else if (isWarning) variant = 'amber';

  let text = '';
  if (timeLeft.hours > 0) {
    text = `Expires in ${timeLeft.hours}h ${timeLeft.minutes}m`;
  } else {
    text = `Expires in ${timeLeft.minutes}m`;
  }

  return (
    <Badge variant={variant} pulse={isUrgent} className="gap-1 font-semibold">
      {showIcon && <Clock className="w-3 h-3" />}
      {text}
    </Badge>
  );
}
