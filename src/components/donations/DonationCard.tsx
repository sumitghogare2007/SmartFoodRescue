import { MapPin, Users, Info, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ExpiryBadge } from './ExpiryBadge';
import { DonationStatusBadge } from './DonationStatusBadge';
import type { FoodDonation } from '../../types';
import { getFoodEmoji } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

export interface DonationCardProps {
  donation: FoodDonation;
  onRequestFood?: (donation: FoodDonation) => void;
  showActions?: boolean;
  compact?: boolean;
}

export function DonationCard({ donation, onRequestFood, showActions = true, compact: _compact = false }: DonationCardProps) {
  const navigate = useNavigate();
  const { authUser } = useAuth();
  const role = authUser?.userType;

  const emoji = getFoodEmoji(donation.foodCategory || '');

  let borderColorClass = 'border-white/10';
  if (donation.status === 'AVAILABLE') {
    const diff = new Date(donation.expiryTime).getTime() - Date.now();
    const hours = diff / (1000 * 60 * 60);
    if (hours < 0) borderColorClass = 'border-l-4 border-l-gray-500';
    else if (hours < 1) borderColorClass = 'border-l-4 border-l-red-500';
    else if (hours < 4) borderColorClass = 'border-l-4 border-l-amber-500';
    else borderColorClass = 'border-l-4 border-l-green-500';
  }

  const formattedDeadline = new Date(donation.expiryTime).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <GlassCard
      className={`p-5 flex flex-col h-full ${borderColorClass} transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/5`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-2xl backdrop-blur-sm border border-white/5 flex-shrink-0">
            {emoji}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-lg text-white truncate">{donation.foodType}</h3>
            <Badge variant="gray" size="sm">{donation.foodCategory}</Badge>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0 ml-2">
          <DonationStatusBadge status={donation.status as any} />
          {donation.status === 'AVAILABLE' && (
            <ExpiryBadge expiryTime={donation.expiryTime} />
          )}
        </div>
      </div>

      <div className="flex-1 space-y-2.5 mb-5">
        <div className="flex items-center text-slate-300 text-sm">
          <Users className="w-4 h-4 mr-2 text-slate-400 flex-shrink-0" />
          <span>{donation.quantity} {donation.unit}</span>
        </div>
        <div className="flex items-center text-slate-300 text-sm">
          <MapPin className="w-4 h-4 mr-2 text-slate-400 flex-shrink-0" />
          <span className="truncate">
            {typeof donation.locationId === 'object' ? (donation.locationId as any).city : 'Location'}
          </span>
        </div>
        <div className="flex items-center text-slate-300 text-sm">
          <Clock className="w-4 h-4 mr-2 text-slate-400 flex-shrink-0" />
          <span>Expires by {formattedDeadline}</span>
        </div>
      </div>

      {showActions && (
        <div className="flex gap-2 mt-auto pt-4 border-t border-white/10">
          <Button
            variant="secondary"
            size="sm"
            fullWidth
            onClick={() => navigate(`/donations/${donation._id}`)}
            icon={<Info className="w-4 h-4" />}
          >
            View Details
          </Button>
          {donation.status === 'AVAILABLE' && role === 'NGO' && onRequestFood && (
            <Button
              variant="primary"
              size="sm"
              fullWidth
              onClick={() => onRequestFood(donation)}
            >
              Request Food
            </Button>
          )}
        </div>
      )}
    </GlassCard>
  );
}

export default DonationCard;
