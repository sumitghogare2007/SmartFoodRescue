import { MapPin, Users, CheckCircle2, Navigation } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';

export interface Props {
  match: any; // using any for mockup
  onAssign?: (ngo: any) => void;
  showAssignButton?: boolean;
}

export function NGOMatchCard({ match, onAssign, showAssignButton = true }: Props) {
  const { ngo, score, distance, factors } = match || {
    ngo: { name: 'Hope Foundation', capacity: 100, city: 'Mumbai' },
    score: 85,
    distance: 2.5,
    factors: ['Category Match', 'Capacity Match', 'Proximity']
  };

  let scoreColor = "text-green-400";
  if (score < 50) scoreColor = "text-red-400";
  else if (score < 75) scoreColor = "text-amber-400";

  return (
    <GlassCard className="p-5 flex flex-col h-full border-l-4 border-l-teal-500">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-semibold text-lg text-white mb-1">{ngo.name}</h3>
          <div className="flex items-center text-sm text-gray-400">
            <MapPin className="w-3.5 h-3.5 mr-1" />
            {ngo.city}
          </div>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${scoreColor}`}>{score}%</div>
          <div className="text-xs text-gray-500">Match Score</div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-md text-sm text-gray-300">
          <Navigation className="w-3.5 h-3.5 text-blue-400" />
          {distance} km away
        </div>
        <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-md text-sm text-gray-300">
          <Users className="w-3.5 h-3.5 text-purple-400" />
          Cap: {ngo.capacity}
        </div>
      </div>

      <div className="flex-1 space-y-2 mb-5">
        <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Match Factors</h4>
        {factors.map((factor: string, i: number) => (
          <div key={i} className="flex items-center text-sm text-gray-300">
            <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
            {factor}
          </div>
        ))}
      </div>

      {showAssignButton && (
        <Button 
          variant="primary" 
          fullWidth 
          onClick={() => onAssign?.(ngo)}
          className="mt-auto"
        >
          Assign Donation
        </Button>
      )}
    </GlassCard>
  );
}
