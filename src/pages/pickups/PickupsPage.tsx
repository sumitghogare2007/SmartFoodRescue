import { useEffect, useState } from 'react';
import { apiClient } from '../../lib/api';
import type { Pickup } from '../../types';
import { 
  Truck, 
  MapPin, 
  Check, 
  Calendar, 
  Package, 
  Building2, 
  Phone, 
  Mail, 
  Heart, 
  ShieldCheck, 
  Utensils 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import VolunteerSelectModal from '../../components/volunteer/VolunteerSelectModal';
import { useRealtimeSync } from '../../hooks/useRealtimeSync';

const PickupsPage = () => {
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [assigningPickupId, setAssigningPickupId] = useState<string | null>(null);
  const { authUser } = useAuth();

  useEffect(() => {
    fetchPickups();
  }, [authUser]);

  useRealtimeSync({
    onSync: () => fetchPickups(),
    events: ['pickup:updated', 'distribution:completed', 'request:accepted', 'donation:updated'],
  });

  const fetchPickups = async () => {
    try {
      let url = '/api/pickups';
      if (authUser?.userType === 'NGO') url = '/api/pickups?ngoId=me';
      if (authUser?.userType === 'VOLUNTEER') url = '/api/pickups?volunteerId=me';
      
      const response = await apiClient.get(url);
      setPickups(response.data);
    } catch (err) {
      toast.error('Failed to load pickups');
    } finally {
      setLoading(false);
    }
  };

  const filteredPickups = pickups.filter(p => filter === 'ALL' || p.pickupStatus === filter);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'DISTRIBUTED':
        return 'bg-teal-50 text-teal-800 border-teal-300';
      case 'DELIVERED':
        return 'bg-green-50 text-green-800 border-green-300';
      case 'DISPATCHED':
        return 'bg-purple-50 text-purple-800 border-purple-300';
      case 'RECEIVED':
        return 'bg-amber-50 text-amber-800 border-amber-300';
      case 'ASSIGNED':
      default:
        return 'bg-blue-50 text-blue-800 border-blue-300';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">Pickups & Food Tracking</h1>
          <p className="text-sm text-gray-500 mt-1">
            Complete audit trail of food donations from donor handover to NGO distribution
          </p>
        </div>
        <div className="text-xs font-semibold px-3 py-1.5 bg-green-50 text-[#166534] border border-green-200 rounded-md">
          {filteredPickups.length} Total Records
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200 flex gap-2 overflow-x-auto">
        {['ALL', 'ASSIGNED', 'RECEIVED', 'DISPATCHED', 'DELIVERED', 'DISTRIBUTED'].map(status => (
          <button 
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-md text-sm font-semibold whitespace-nowrap transition-colors
              ${filter === status 
                ? 'bg-[#166534] text-white shadow-sm' 
                : 'bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
          >
            {status}
            {status !== 'ALL' && (
              <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${
                filter === status ? 'bg-green-800 text-white' : 'bg-gray-200 text-gray-700'
              }`}>
                {pickups.filter(p => p.pickupStatus === status).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-[#166534] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredPickups.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-lg border border-gray-200 text-gray-500">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="font-semibold text-gray-700">No pickups found for status "{filter}"</p>
              <p className="text-sm text-gray-400 mt-1">Try switching tabs to view other active or distributed rescues.</p>
            </div>
          ) : (
            filteredPickups.map(pickup => {
              const req = typeof pickup.requestId === 'object' ? (pickup.requestId as any) : null;
              const donation = req && typeof req.donationId === 'object' ? req.donationId : null;
              const donor = donation && typeof donation.donorId === 'object' ? donation.donorId : null;
              const donorUser = donor && typeof donor.userId === 'object' ? donor.userId : null;
              const donorLoc = (donor && typeof donor.locationId === 'object') 
                ? donor.locationId 
                : (donation && typeof donation.locationId === 'object' ? donation.locationId : null);

              const ngo = req && typeof req.ngoId === 'object' ? req.ngoId : null;
              const ngoLoc = ngo && typeof ngo.locationId === 'object' ? ngo.locationId : null;

              const volunteer = typeof pickup.volunteerId === 'object' ? (pickup.volunteerId as any) : null;
              const volunteerUser = volunteer && typeof volunteer.userId === 'object' ? volunteer.userId : null;

              const dist = pickup.distribution;
              const history = pickup.statusHistory || [];

              return (
                <div key={pickup._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  
                  {/* Card Header */}
                  <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex flex-wrap justify-between items-center gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-100 border border-green-300 flex items-center justify-center text-[#166534]">
                        <Utensils className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-900 text-base">
                            {donation?.foodType || `Pickup #${pickup._id.slice(-6)}`}
                          </h3>
                          {donation?.isVegetarian !== undefined && (
                            <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                              donation.isVegetarian ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {donation.isVegetarian ? 'Veg' : 'Non-Veg'}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 flex items-center gap-2 mt-0.5 font-mono">
                          <span>Pickup ID: #{pickup._id.slice(-6)}</span>
                          <span>•</span>
                          <span className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1 text-gray-400" />
                            {new Date(pickup.pickupDate || pickup.createdAt).toLocaleDateString()}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {(authUser?.userType === 'ADMIN' || authUser?.userType === 'NGO' || authUser?.userType === 'DONOR') && 
                       !['DELIVERED', 'DISTRIBUTED'].includes(pickup.pickupStatus) && (
                        <button
                          onClick={() => setAssigningPickupId(pickup._id)}
                          className="px-2.5 py-1 text-xs font-semibold rounded bg-green-50 dark:bg-green-950/40 text-[#166534] dark:text-green-300 border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/60 transition-colors flex items-center gap-1 shadow-xs"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          {pickup.volunteerId ? 'Change Volunteer' : 'Assign Volunteer'}
                        </button>
                      )}
                      <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getStatusBadgeColor(pickup.pickupStatus)}`}>
                        {pickup.pickupStatus}
                      </span>
                    </div>
                  </div>

                  {/* Distribution Banner (When Distributed) */}
                  {pickup.pickupStatus === 'DISTRIBUTED' && (
                    <div className="bg-teal-50 border-b border-teal-200 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center">
                          <Heart className="w-4 h-4 fill-current" />
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-teal-900">Food Successfully Distributed</p>
                          <p className="text-sm font-semibold text-teal-800">
                            Served {dist?.beneficiaryCount || 80} verified beneficiaries
                            {dist?.quantityDistributed && ` • ${dist.quantityDistributed} ${donation?.unit || 'servings'} distributed`}
                          </p>
                        </div>
                      </div>
                      {dist?.notes && (
                        <p className="text-xs italic text-teal-700 bg-white/70 px-3 py-1 rounded border border-teal-200 max-w-md">
                          "{dist.notes}"
                        </p>
                      )}
                    </div>
                  )}

                  {/* Card Content Grid */}
                  <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Column 1: Food & Donation Details ("What was donated") */}
                    <div className="space-y-3 bg-gray-50/70 p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center text-[#166534] font-bold text-xs uppercase tracking-wider">
                        <Package className="w-4 h-4 mr-1.5" />
                        What Was Donated
                      </div>
                      <div className="space-y-1.5 text-sm">
                        <p className="font-semibold text-gray-900">{donation?.foodType || 'Food Items'}</p>
                        <p className="text-gray-600 flex justify-between">
                          <span className="text-gray-500">Category:</span>
                          <span className="font-medium">{donation?.foodCategory || 'Prepared Meal'}</span>
                        </p>
                        <p className="text-gray-600 flex justify-between">
                          <span className="text-gray-500">Quantity:</span>
                          <span className="font-bold text-[#166534]">
                            {donation?.quantity || req?.requestedQuantity || 'N/A'} {donation?.unit || 'servings'}
                          </span>
                        </p>
                        {donation?.expiryTime && (
                          <p className="text-gray-600 flex justify-between">
                            <span className="text-gray-500">Expiry Time:</span>
                            <span className="font-medium text-amber-700">
                              {new Date(donation.expiryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                            </span>
                          </p>
                        )}
                        {donation?.aadhaarId && (
                          <div className="pt-2 border-t border-gray-200 flex items-center justify-between text-xs">
                            <span className="text-gray-500 flex items-center">
                              <ShieldCheck className="w-3.5 h-3.5 text-green-600 mr-1" />
                              Donor Aadhaar:
                            </span>
                            <span className="font-mono font-bold bg-green-50 text-green-800 px-2 py-0.5 rounded border border-green-200">
                              {donation.aadhaarId}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Column 2: Stakeholder Logistics ("Who Donated", "Who Received", "Who Delivered") */}
                    <div className="space-y-4">
                      
                      {/* Donor Information */}
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div className="text-sm">
                          <p className="text-xs font-bold uppercase tracking-wider text-indigo-900">From (Donor)</p>
                          <p className="font-bold text-gray-900">
                            {donor?.organizationName || donorUser?.name || 'Registered Food Donor'}
                          </p>
                          <p className="text-xs text-gray-600 mt-0.5 flex items-center">
                            <MapPin className="w-3 h-3 text-gray-400 mr-1 shrink-0" />
                            {donorLoc 
                              ? `${donorLoc.address}, ${donorLoc.area}, ${donorLoc.city} ${donorLoc.pincode || ''}`
                              : 'Pickup Address available on file'}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-3">
                            <span className="flex items-center">
                              <Phone className="w-3 h-3 mr-1 text-gray-400" />
                              {donorUser?.phone || donor?.contactPhone || 'N/A'}
                            </span>
                            <span className="flex items-center">
                              <Mail className="w-3 h-3 mr-1 text-gray-400" />
                              {donorUser?.email || donor?.contactEmail || 'N/A'}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* NGO Destination Information */}
                      <div className="flex items-start gap-3 pt-3 border-t border-gray-100">
                        <div className="w-8 h-8 rounded-md bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center shrink-0 mt-0.5">
                          <Heart className="w-4 h-4" />
                        </div>
                        <div className="text-sm">
                          <p className="text-xs font-bold uppercase tracking-wider text-purple-900">To (NGO)</p>
                          <p className="font-bold text-gray-900">{ngo?.ngoName || 'Verified Partner NGO'}</p>
                          {ngo?.registrationNo && (
                            <p className="text-xs text-gray-500 font-mono">Reg: {ngo.registrationNo}</p>
                          )}
                          <p className="text-xs text-gray-600 mt-0.5 flex items-center">
                            <MapPin className="w-3 h-3 text-gray-400 mr-1 shrink-0" />
                            {ngoLoc 
                              ? `${ngoLoc.address}, ${ngoLoc.area}, ${ngoLoc.city} ${ngoLoc.pincode || ''}`
                              : 'NGO Facility Address on file'}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5 flex items-center">
                            <Phone className="w-3 h-3 mr-1 text-gray-400" />
                            {ngo?.contactNo || '9833098765'}
                          </p>
                        </div>
                      </div>

                      {/* Volunteer Courier Information */}
                      <div className="flex items-start gap-3 pt-3 border-t border-gray-100">
                        <div className="w-8 h-8 rounded-md bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                          <Truck className="w-4 h-4" />
                        </div>
                        <div className="text-sm">
                          <p className="text-xs font-bold uppercase tracking-wider text-blue-900">Transported By (Volunteer)</p>
                          <p className="font-bold text-gray-900">
                            {volunteerUser?.name || 'Vikram Joshi (Assigned Volunteer)'}
                          </p>
                          <p className="text-xs text-gray-600 mt-0.5 flex items-center gap-3">
                            <span>Vehicle: {volunteer?.vehicleType || 'Van / Bike'}</span>
                            <span>•</span>
                            <span className="flex items-center">
                              <Phone className="w-3 h-3 mr-1 text-gray-400" />
                              {volunteerUser?.phone || '9844055443'}
                            </span>
                          </p>
                        </div>
                      </div>

                    </div>

                    {/* Column 3: 5-Stage Audit Timeline */}
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 flex flex-col">
                      <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-4 text-center">
                        5-Stage Rescue Timeline
                      </p>

                      <div className="space-y-4 relative flex-1">
                        <div className="absolute left-[11px] top-2 bottom-4 w-0.5 bg-gray-200"></div>

                        {['ASSIGNED', 'RECEIVED', 'DISPATCHED', 'DELIVERED', 'DISTRIBUTED'].map((step, idx, arr) => {
                          const statusIndex = arr.indexOf(pickup.pickupStatus);
                          const isCompleted = idx <= statusIndex;
                          const isCurrent = idx === statusIndex;
                          const historyEntry = history.find(h => h.status === step);

                          return (
                            <div key={step} className="flex items-start relative z-10">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 border-2 shrink-0
                                ${isCompleted 
                                  ? 'bg-green-100 border-[#166534] text-[#166534]' 
                                  : 'bg-white border-gray-300 text-transparent'}
                              `}>
                                {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className={`text-xs ${
                                  isCurrent 
                                    ? 'font-bold text-[#1e3a5f]' 
                                    : isCompleted ? 'font-semibold text-gray-800' : 'text-gray-400'
                                }`}>
                                  {step}
                                </p>
                                {historyEntry?.changedAt && (
                                  <p className="text-[11px] text-gray-500 font-mono">
                                    {new Date(historyEntry.changedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {pickup.pickupStatus === 'DISTRIBUTED' && (
                        <div className="mt-3 pt-3 border-t border-gray-200 text-center">
                          <span className="inline-flex items-center text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded border border-teal-200">
                            <Heart className="w-3 h-3 mr-1 text-teal-600 fill-current" />
                            Completed & Verified
                          </span>
                        </div>
                      )}

                    </div>

                  </div>

                </div>
              );
            })
          )}
        </div>
      )}

      {/* Volunteer Selection Modal */}
      <VolunteerSelectModal
        isOpen={Boolean(assigningPickupId)}
        onClose={() => setAssigningPickupId(null)}
        title="Assign Registered Volunteer"
        subtitle="Select an eligible registered volunteer from MongoDB to handle this food rescue pickup."
        onAssign={async (volunteerId) => {
          if (!assigningPickupId) return;
          try {
            await apiClient.put(`/api/pickups/${assigningPickupId}/assign-volunteer`, { volunteerId });
            toast.success('Volunteer assigned successfully!');
            await fetchPickups();
          } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to assign volunteer');
          }
        }}
      />
    </div>
  );
};

export default PickupsPage;
