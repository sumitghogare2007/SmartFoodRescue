import { Check } from 'lucide-react';
import { cn } from '../ui/GlassCard';

export interface TimelineStep {
  label: string;
  status: 'completed' | 'current' | 'pending';
  timestamp?: string;
  description?: string;
}

export interface Props {
  // Using any to skip strict typing for UI mockup
  donation: any; 
  pickup?: any;
}

export function DonationTimeline({ donation, pickup: _pickup }: Props) {
  // Mock logic to derive steps from donation status
  const statuses = ['Available', 'Requested', 'Accepted', 'Assigned', 'Picked Up', 'Delivered', 'Distributed'];
  const currentIndex = statuses.indexOf(donation?.status || 'Available');
  
  const steps: TimelineStep[] = [
    { label: 'Donation Created', status: currentIndex >= 0 ? 'completed' : 'pending', timestamp: '10:00 AM' },
    { label: 'NGO Requested', status: currentIndex > 0 ? 'completed' : currentIndex === 0 ? 'current' : 'pending', timestamp: currentIndex > 0 ? '10:30 AM' : undefined },
    { label: 'Request Accepted', status: currentIndex > 1 ? 'completed' : currentIndex === 1 ? 'current' : 'pending', timestamp: currentIndex > 1 ? '11:00 AM' : undefined },
    { label: 'Volunteer Assigned', status: currentIndex > 2 ? 'completed' : currentIndex === 2 ? 'current' : 'pending' },
    { label: 'Food Picked Up', status: currentIndex > 3 ? 'completed' : currentIndex === 3 ? 'current' : 'pending' },
    { label: 'Delivered', status: currentIndex > 4 ? 'completed' : currentIndex === 4 ? 'current' : 'pending' },
    { label: 'Distributed', status: currentIndex > 5 ? 'completed' : currentIndex === 5 ? 'current' : 'pending' },
  ];

  return (
    <div className="relative space-y-6 before:absolute before:inset-0 before:ml-[15px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
      {steps.map((step, index) => (
        <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
          <div className={cn(
            "flex items-center justify-center w-8 h-8 rounded-full border-2 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow z-10",
            step.status === 'completed' ? "bg-green-500 border-green-500 text-white" :
            step.status === 'current' ? "bg-[#0A0F1E] border-green-500 text-green-500" :
            "bg-[#0A0F1E] border-white/20 text-gray-500"
          )}>
            {step.status === 'completed' && <Check className="w-4 h-4" />}
            {step.status === 'current' && <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />}
          </div>
          
          <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-1">
              <h4 className={cn(
                "font-semibold text-sm",
                step.status === 'pending' ? "text-gray-400" : "text-white"
              )}>
                {step.label}
              </h4>
              {step.timestamp && (
                <span className="text-xs text-gray-500">{step.timestamp}</span>
              )}
            </div>
            {step.description && (
              <p className="text-sm text-gray-400">{step.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
