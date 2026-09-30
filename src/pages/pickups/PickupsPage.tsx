import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
  Utensils,
  Navigation,
  ArrowRight
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
      const data: Pickup[] = Array.isArray(response.data) ? response.data : [];
      data.sort((a: any, b: any) => {
        const timeA = new Date(a.createdAt || a.pickupDate || 0).getTime();
        const timeB = new Date(b.createdAt || b.pickupDate || 0).getTime();
        return timeB - timeA;
      });
      setPickups(data);
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
        return 'bg-teal-50 text-teal-800 border-teal-200 ring-1 ring-teal-500/20';
      case 'DELIVERED':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200 ring-1 ring-emerald-500/20';
      case 'ARRIVED':
        return 'bg-purple-50 text-purple-800 border-purple-200 ring-1 ring-purple-500/20';
      case 'EN_ROUTE':
        return 'bg-emerald-50 text-emerald-900 border-emerald-300 ring-2 ring-emerald-500/30 animate-pulse';
      case 'DISPATCHED':
        return 'bg-amber-50 text-amber-800 border-amber-200 ring-1 ring-amber-500/20';
      case 'RECEIVED':
        return 'bg-blue-50 text-blue-800 border-blue-200 ring-1 ring-blue-500/20';
      case 'ASSIGNED':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 ring-1 ring-slate-400/20';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Pickups & Food Tracking</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Complete audit trail of food donations from donor handover to NGO distribution
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-full text-xs font-semibold shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
          <span>{filteredPickups.length} Total Records</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white/80 backdrop-blur-sm p-1.5 rounded-xl shadow-xs border border-slate-200/80 flex gap-1.5 overflow-x-auto">
        {['ALL', 'ASSIGNED', 'RECEIVED', 'DISPATCHED', 'EN_ROUTE', 'ARRIVED', 'DELIVERED', 'DISTRIBUTED'].map(status => (
          <button 
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 flex items-center gap-2
              ${filter === status 
                ? 'bg-[#166534] text-white shadow-xs' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'}`}
          >
            <span>{status}</span>
            {status !== 'ALL' && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                filter === status ? 'bg-emerald-950/40 text-white' : 'bg-slate-200 text-slate-700'
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
                <div key={pickup._id} className="bg-white rounded-2xl shadow-xs hover:shadow-md border border-slate-200/90 transition-all duration-200 overflow-hidden">
                  
                  {/* Card Header */}
                  <div className="bg-slate-50/70 border-b border-slate-200/80 px-6 py-4 flex flex-wrap justify-between items-center gap-3.5">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-[#166534] shadow-xs shrink-0">
                        <Utensils className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-base">
                            {donation?.foodType || `Pickup #${pickup._id.slice(-6)}`}
                          </h3>
                          {donation?.isVegetarian !== undefined && (
                            <span className={`px-2 py-0.5 text-[11px] font-bold rounded-full ${
                              donation.isVegetarian ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                            }`}>
                              {donation.isVegetarian ? 'Veg' : 'Non-Veg'}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5 font-mono">
                          <span>Pickup ID: #{pickup._id.slice(-6)}</span>
                          <span>•</span>
                          <span className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1 text-slate-400" />
                            {new Date(pickup.pickupDate || pickup.createdAt).toLocaleDateString()}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!['DELIVERED', 'DISTRIBUTED'].includes(pickup.pickupStatus) && (
                        <Link
                          to={`/tracking/${pickup._id}`}
                          className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#166534] hover:bg-green-800 text-white shadow-xs transition-colors flex items-center gap-1.5"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Track Volunteer</span>
                          {['EN_ROUTE', 'DISPATCHED'].includes(pickup.pickupStatus) && (
                            <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
                          )}
                        </Link>
                      )}
                      {(authUser?.userType === 'ADMIN' || authUser?.userType === 'NGO' || authUser?.userType === 'DONOR') && 
                       !['DELIVERED', 'DISTRIBUTED'].includes(pickup.pickupStatus) && (
                        <button
                          onClick={() => setAssigningPickupId(pickup._id)}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-colors flex items-center gap-1.5 shadow-xs"
                        >
                          <Truck className="w-3.5 h-3.5 text-slate-500" />
                          {pickup.volunteerId ? 'Change Volunteer' : 'Assign Volunteer'}
                        </button>
                      )}
                      <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getStatusBadgeColor(pickup.pickupStatus)}`}>
                        {pickup.pickupStatus}
                      </span>
                    </div>
                  </div>

                  {/* Active Live Tracking Banner for active pickup stages */}
                  {!['DELIVERED', 'DISTRIBUTED'].includes(pickup.pickupStatus) && (
                    <div className="bg-gradient-to-r from-emerald-50/90 via-teal-50/80 to-emerald-50/90 border-b border-emerald-200/70 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 text-xs">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
                        </span>
                        <span className="font-semibold text-emerald-950">
                          {pickup.pickupStatus === 'EN_ROUTE'
                            ? '🚚 Volunteer is En Route with Rescue Food'
                            : pickup.pickupStatus === 'ARRIVED'
                            ? '📍 Volunteer Has Arrived at Destination (NGO)'
                            : pickup.pickupStatus === 'DISPATCHED'
                            ? '📦 Delivery Dispatched & Ready for Navigation'
                            : pickup.pickupStatus === 'RECEIVED'
                            ? '🍽️ Food Handover Completed • Rescue in Transit'
                            : pickup.volunteerId
                            ? '🤝 Volunteer Assigned • Live Tracking Ready'
                            : '🗺️ Rescue Order Created • Tracking Ready'}
                        </span>
                        <span className="text-emerald-700/80 hidden sm:inline">• Live GPS tracking available</span>
                      </div>
                      <Link
                        to={`/tracking/${pickup._id}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#166534] hover:bg-green-800 text-white rounded-lg text-xs font-semibold transition-all shadow-xs"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        <span>Track Volunteer Live Map</span>
                        <ArrowRight className="w-3 h-3 ml-0.5" />
                      </Link>
                    </div>
                  )}

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
                    <div className="space-y-3 bg-slate-50/70 p-4.5 rounded-xl border border-slate-200/80">
                      <div className="flex items-center text-[#166534] font-bold text-xs uppercase tracking-wider">
                        <Package className="w-4 h-4 mr-1.5" />
                        What Was Donated
                      </div>
                      <div className="space-y-2 text-sm">
                        <p className="font-bold text-slate-900 text-base">{donation?.foodType || 'Food Items'}</p>
                        <p className="text-slate-600 flex justify-between items-center text-xs">
                          <span className="text-slate-500">Category:</span>
                          <span className="font-semibold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">{donation?.foodCategory || 'Prepared Meal'}</span>
                        </p>
                        <p className="text-slate-600 flex justify-between items-center text-xs">
                          <span className="text-slate-500">Quantity:</span>
                          <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shadow-2xs">
                            {donation?.quantity || req?.requestedQuantity || 'N/A'} {donation?.unit || 'servings'}
                          </span>
                        </p>
                        {donation?.expiryTime && (
                          <p className="text-slate-600 flex justify-between items-center text-xs">
                            <span className="text-slate-500">Expiry Time:</span>
                            <span className="font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 shadow-2xs">
                              {new Date(donation.expiryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                            </span>
                          </p>
                        )}
                        {donation?.aadhaarId && (
                          <div className="pt-2.5 border-t border-slate-200 flex items-center justify-between text-xs">
                            <span className="text-slate-500 flex items-center font-medium">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 mr-1" />
                              Donor Aadhaar:
                            </span>
                            <span className="font-mono font-bold bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-md border border-emerald-200 shadow-2xs">
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
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200/70 text-indigo-700 flex items-center justify-center shrink-0 shadow-2xs">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div className="text-sm">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-900">From (Donor)</p>
                          <p className="font-bold text-slate-900">
                            {donor?.organizationName || donorUser?.name || 'Registered Food Donor'}
                          </p>
                          <p className="text-xs text-slate-600 mt-0.5 flex items-center">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 mr-1 shrink-0" />
                            {donorLoc 
                              ? `${donorLoc.address}, ${donorLoc.area}, ${donorLoc.city} ${donorLoc.pincode || ''}`
                              : 'Pickup Address available on file'}
                          </p>
                          <p className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                            <span className="flex items-center">
                              <Phone className="w-3 h-3 mr-1 text-slate-400" />
                              {donorUser?.phone || donor?.contactPhone || 'N/A'}
                            </span>
                            <span className="flex items-center">
                              <Mail className="w-3 h-3 mr-1 text-slate-400" />
                              {donorUser?.email || donor?.contactEmail || 'N/A'}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* NGO Destination Information */}
                      <div className="flex items-start gap-3 pt-3.5 border-t border-slate-100">
                        <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200/70 text-purple-700 flex items-center justify-center shrink-0 shadow-2xs">
                          <Heart className="w-4 h-4" />
                        </div>
                        <div className="text-sm">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-purple-900">To (NGO)</p>
                          <p className="font-bold text-slate-900">{ngo?.ngoName || 'Verified Partner NGO'}</p>
                          {ngo?.registrationNo && (
                            <p className="text-xs text-slate-500 font-mono">Reg: {ngo.registrationNo}</p>
                          )}
                          <p className="text-xs text-slate-600 mt-0.5 flex items-center">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 mr-1 shrink-0" />
                            {ngoLoc 
                              ? `${ngoLoc.address}, ${ngoLoc.area}, ${ngoLoc.city} ${ngoLoc.pincode || ''}`
                              : 'NGO Facility Address on file'}
                          </p>
                          <p className="text-xs text-slate-500 mt-1 flex items-center">
                            <Phone className="w-3 h-3 mr-1 text-slate-400" />
                            {ngo?.contactNo || '9833098765'}
                          </p>
                        </div>
                      </div>

                      {/* Volunteer Courier Information */}
                      <div className="flex items-start gap-3 pt-3.5 border-t border-slate-100">
                        <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-200/70 text-sky-700 flex items-center justify-center shrink-0 shadow-2xs">
                          <Truck className="w-4 h-4" />
                        </div>
                        <div className="text-sm">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-sky-900">Transported By (Volunteer)</p>
                          <p className="font-bold text-slate-900">
                            {volunteerUser?.name || 'Assigned Volunteer'}
                          </p>
                          <p className="text-xs text-slate-600 mt-1 flex items-center gap-3">
                            <span className="font-medium text-slate-700">Vehicle: {volunteer?.vehicleType || 'Van / Bike'}</span>
                            <span>•</span>
                            <span className="flex items-center">
                              <Phone className="w-3 h-3 mr-1 text-slate-400" />
                              {volunteerUser?.phone || 'N/A'}
                            </span>
                          </p>
                        </div>
                      </div>

                    </div>

                    {/* Column 3: 7-Stage Audit Timeline */}
                    <div className="bg-slate-50/70 rounded-xl p-4.5 border border-slate-200/80 flex flex-col">
                      <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 text-center">
                        7-Stage Rescue Timeline
                      </p>

                      <div className="space-y-4 relative flex-1">
                        <div className="absolute left-[11px] top-2 bottom-4 w-0.5 bg-slate-200"></div>

                        {['ASSIGNED', 'RECEIVED', 'DISPATCHED', 'EN_ROUTE', 'ARRIVED', 'DELIVERED', 'DISTRIBUTED'].map((step, idx, arr) => {
                          const statusIndex = arr.indexOf(pickup.pickupStatus);
                          const isCompleted = idx <= statusIndex;
                          const isCurrent = idx === statusIndex;
                          const historyEntry = history.find(h => h.status === step);

                          return (
                            <div key={step} className="flex items-start relative z-10">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 border-2 shrink-0 transition-all
                                ${isCurrent 
                                  ? 'bg-[#166534] border-[#166534] text-white ring-4 ring-emerald-100 shadow-xs' 
                                  : isCompleted 
                                  ? 'bg-emerald-100 border-[#166534] text-[#166534]' 
                                  : 'bg-white border-slate-300 text-transparent'}
                              `}>
                                {(isCompleted || isCurrent) && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className={`text-xs ${
                                  isCurrent 
                                    ? 'font-bold text-[#166534]' 
                                    : isCompleted ? 'font-semibold text-slate-800' : 'text-slate-400'
                                }`}>
                                  {step}
                                </p>
                                {historyEntry?.changedAt && (
                                  <p className="text-[11px] text-slate-500 font-mono">
                                    {new Date(historyEntry.changedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {pickup.pickupStatus === 'DISTRIBUTED' && (
                        <div className="mt-3 pt-3 border-t border-slate-200 text-center">
                          <span className="inline-flex items-center text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200 shadow-2xs">
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
