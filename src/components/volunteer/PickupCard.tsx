import { MapPin, Clock, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export interface Props {
  pickup: any; // using any for mockup
  onUpdateStatus?: (pickupId: string, status: string) => void;
  isVolunteerView?: boolean;
}

export function PickupCard({ pickup, onUpdateStatus, isVolunteerView = true }: Props) {
  const { id, donationTitle, category, pickupAddress, deliveryAddress, time, status } = pickup || {
    id: '1', donationTitle: '50 Meals', category: 'Prepared Food', 
    pickupAddress: 'Hotel Green, Andheri West', deliveryAddress: 'Hope Foundation, Bandra',
    time: '2:30 PM Today', status: 'Assigned'
  };

  const getStatusBadge = (s: string) => {
    switch(s) {
      case 'ASSIGNED': return <Badge variant="blue">ASSIGNED</Badge>;
      case 'RECEIVED': return <Badge variant="amber">FOOD RECEIVED</Badge>;
      case 'DISPATCHED': return <Badge variant="purple">DISPATCHED</Badge>;
      case 'DELIVERED': return <Badge variant="green">DELIVERED</Badge>;
      case 'DISTRIBUTED': return <Badge variant="teal">DISTRIBUTED</Badge>;
      default: return <Badge variant="gray">{s}</Badge>;
    }
  };

  const renderActionButton = () => {
    if (!isVolunteerView || !onUpdateStatus) return null;

    switch(status) {
      case 'ASSIGNED':
        return <Button fullWidth onClick={() => onUpdateStatus(id, 'RECEIVED')}>Mark Food Received</Button>;
      case 'RECEIVED':
        return <Button fullWidth variant="secondary" onClick={() => onUpdateStatus(id, 'DISPATCHED')}>Mark Dispatched</Button>;
      case 'DISPATCHED':
        return <Button fullWidth onClick={() => onUpdateStatus(id, 'DELIVERED')}>Mark Delivered</Button>;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-semibold text-lg text-gray-900 mb-1">{donationTitle}</h3>
          <Badge variant="gray" size="sm">{category}</Badge>
        </div>
        <div>
          {getStatusBadge(status)}
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 mb-5 border border-gray-200 space-y-4">
        <div className="flex gap-3">
          <div className="w-5 h-5 rounded-full bg-green-100 border border-green-500 flex items-center justify-center shrink-0 mt-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-600" />
          </div>
          <div>
            <div className="text-xs font-bold text-green-800 mb-0.5 uppercase tracking-wide">Pickup Location</div>
            <div className="text-sm text-gray-700">{pickupAddress}</div>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="w-5 h-5 rounded-full bg-blue-100 border border-blue-500 flex items-center justify-center shrink-0 mt-0.5">
            <MapPin className="w-3 h-3 text-blue-600" />
          </div>
          <div>
            <div className="text-xs font-bold text-blue-800 mb-0.5 uppercase tracking-wide">Destination (NGO)</div>
            <div className="text-sm text-gray-700">{deliveryAddress}</div>
          </div>
        </div>
      </div>

      <div className="flex items-center text-sm text-gray-500 mb-5">
        <Clock className="w-4 h-4 mr-2 text-gray-400" />
        Scheduled: {time}
      </div>

      {renderActionButton()}

      {['DISPATCHED', 'EN_ROUTE', 'ARRIVED'].includes(status) && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <Link
            to={`/tracking/${id}`}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-[#166534] hover:bg-green-800 text-white rounded-md text-xs font-bold transition shadow-xs"
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Track Volunteer</span>
          </Link>
        </div>
      )}
    </div>
  );
}
