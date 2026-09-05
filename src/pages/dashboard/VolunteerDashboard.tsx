import { useEffect, useState } from 'react';
import { volunteerService } from '../../services/volunteerService';
import { apiClient } from '../../lib/api';
import type { Pickup, StatusHistoryEntry } from '../../types';
import { Truck, MapPin, Package, Check, Loader, Building2, Phone, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

const VolunteerDashboard = () => {
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [historyMap, setHistoryMap] = useState<Record<string, StatusHistoryEntry[]>>({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchPickups();
  }, []);

  const fetchPickups = async () => {
    try {
      const data = await volunteerService.getMyPickups();
      setPickups(data);

      // Load tracking history for active pickups
      const histories: Record<string, StatusHistoryEntry[]> = {};
      await Promise.all(
        data.map(async (p) => {
          try {
            const h = await volunteerService.getTrackingHistory(p._id);
            histories[p._id] = h;
          } catch {
            histories[p._id] = p.statusHistory || [];
          }
        })
      );
      setHistoryMap(histories);
    } catch (err) {
      toast.error('Failed to load assigned pickups');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setActionLoading(id);
    try {
      if (newStatus === 'ASSIGNED') {
        // Volunteer accepts assignment
        await apiClient.put(`/api/pickups/${id}/assign-volunteer`, {});
        toast.success('Assignment accepted!');
      } else {
        await volunteerService.updatePickupStatus(id, newStatus);
        toast.success(`Status updated: ${newStatus}`);
      }
      await fetchPickups(); // Refresh data
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-[#166534] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const activePickups = pickups.filter(p => !['DELIVERED', 'DISTRIBUTED'].includes(p.pickupStatus));
  const completedPickups = pickups.filter(p => ['DELIVERED', 'DISTRIBUTED'].includes(p.pickupStatus));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">Volunteer Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">View your assigned pickups and track live rescue deliveries</p>
        </div>
      </div>

      <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 flex items-center">
            <Truck className="w-4 h-4 mr-2 text-[#166534]" />
            Active Assigned Pickups ({activePickups.length})
          </h2>
        </div>

        <div className="divide-y divide-gray-200">
          {activePickups.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              No active pickups currently assigned to you.
            </div>
          ) : (
            activePickups.map((pickup) => {
              const req = pickup.requestId as any;
              const don = req?.donationId as any;
              const donor = don?.donorId as any;
              const donorLoc = don?.locationId as any;
              const ngo = req?.ngoId as any;
              const ngoLoc = ngo?.locationId as any;
              const history = historyMap[pickup._id] || pickup.statusHistory || [];

              return (
                <div key={pickup._id} className="p-6 space-y-5 hover:bg-gray-50/50">
                  {/* Header Row */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-gray-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-base">Pickup #{pickup._id.slice(-6)}</span>
                        <span className="px-2.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold rounded-full">
                          {pickup.pickupStatus}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 flex items-center mt-1">
                        <Calendar className="w-3.5 h-3.5 mr-1 text-gray-400" />
                        Scheduled: {new Date(pickup.pickupDate).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Single Appropriate Next Action Button */}
                    <div>
                      {!pickup.volunteerId && (
                        <button
                          onClick={() => handleUpdateStatus(pickup._id, 'ASSIGNED')}
                          disabled={actionLoading === pickup._id}
                          className="px-4 py-2 bg-[#166534] text-white rounded text-xs font-bold hover:bg-green-800 disabled:opacity-50 flex items-center"
                        >
                          {actionLoading === pickup._id && <Loader className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                          Accept Assignment
                        </button>
                      )}

                      {pickup.pickupStatus === 'ASSIGNED' && (
                        <button
                          onClick={() => handleUpdateStatus(pickup._id, 'RECEIVED')}
                          disabled={actionLoading === pickup._id}
                          className="px-4 py-2 bg-blue-700 text-white rounded text-xs font-bold hover:bg-blue-800 disabled:opacity-50 flex items-center shadow-sm"
                        >
                          {actionLoading === pickup._id ? <Loader className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Package className="w-3.5 h-3.5 mr-1.5" />}
                          Food Received
                        </button>
                      )}

                      {pickup.pickupStatus === 'RECEIVED' && (
                        <button
                          onClick={() => handleUpdateStatus(pickup._id, 'DISPATCHED')}
                          disabled={actionLoading === pickup._id}
                          className="px-4 py-2 bg-amber-600 text-white rounded text-xs font-bold hover:bg-amber-700 disabled:opacity-50 flex items-center shadow-sm"
                        >
                          {actionLoading === pickup._id ? <Loader className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Truck className="w-3.5 h-3.5 mr-1.5" />}
                          Dispatched
                        </button>
                      )}

                      {pickup.pickupStatus === 'DISPATCHED' && (
                        <button
                          onClick={() => handleUpdateStatus(pickup._id, 'DELIVERED')}
                          disabled={actionLoading === pickup._id}
                          className="px-4 py-2 bg-[#166534] text-white rounded text-xs font-bold hover:bg-green-800 disabled:opacity-50 flex items-center shadow-sm"
                        >
                          {actionLoading === pickup._id ? <Loader className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Check className="w-3.5 h-3.5 mr-1.5" />}
                          Delivered
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Food & Quantity Info */}
                  <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div>
                      <span className="font-semibold text-emerald-900">Food: </span>
                      <span className="font-bold text-gray-900">{don?.foodType || 'Prepared Meals'}</span>
                      {don?.isVegetarian && <span className="ml-2 text-emerald-700 font-medium">(Pure Veg)</span>}
                    </div>
                    <div>
                      <span className="font-semibold text-emerald-900">Quantity: </span>
                      <span className="font-bold text-gray-900">{don?.quantity} {don?.unit}</span>
                    </div>
                    {don?.aadhaarId && (
                      <div className="font-mono text-gray-600">
                        Aadhaar: <span className="text-gray-800">{don?.aadhaarId}</span>
                      </div>
                    )}
                  </div>

                  {/* Donor & NGO Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Pickup Point: Donor */}
                    <div className="bg-white p-4 rounded-lg border border-gray-200 text-xs space-y-2">
                      <div className="flex items-center text-green-800 font-bold uppercase tracking-wide">
                        <Building2 className="w-4 h-4 mr-1.5 text-[#166534]" />
                        Pickup Location (Donor)
                      </div>
                      <p className="font-bold text-gray-900 text-sm">{donor?.organizationName || 'Donor Center'}</p>
                      <div className="text-gray-600 flex items-start">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 mr-1 mt-0.5 flex-shrink-0" />
                        <span>
                          {donorLoc ? `${donorLoc.address}, ${donorLoc.area}, ${donorLoc.city} - ${donorLoc.pincode}` : 'Address on file'}
                        </span>
                      </div>
                      <div className="text-gray-600 flex items-center pt-1">
                        <Phone className="w-3.5 h-3.5 text-gray-400 mr-1 flex-shrink-0" />
                        <span>Contact: {donor?.contactName || 'Staff'} ({donor?.contactPhone || 'N/A'})</span>
                      </div>
                    </div>

                    {/* Delivery Point: NGO */}
                    <div className="bg-white p-4 rounded-lg border border-gray-200 text-xs space-y-2">
                      <div className="flex items-center text-blue-800 font-bold uppercase tracking-wide">
                        <Truck className="w-4 h-4 mr-1.5 text-blue-700" />
                        Delivery Destination (NGO)
                      </div>
                      <p className="font-bold text-gray-900 text-sm">{ngo?.ngoName || 'NGO Destination'}</p>
                      <div className="text-gray-600 flex items-start">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 mr-1 mt-0.5 flex-shrink-0" />
                        <span>
                          {ngoLoc ? `${ngoLoc.address}, ${ngoLoc.area}, ${ngoLoc.city} - ${ngoLoc.pincode}` : 'Shelter Center'}
                        </span>
                      </div>
                      <div className="text-gray-600 flex items-center pt-1">
                        <Phone className="w-3.5 h-3.5 text-gray-400 mr-1 flex-shrink-0" />
                        <span>Contact: {ngo?.contactNo || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Tracking Timeline */}
                  <div className="pt-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Tracking Timeline</p>
                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                      {['ASSIGNED', 'RECEIVED', 'DISPATCHED', 'DELIVERED'].map((step, idx, arr) => {
                        const sIdx = arr.indexOf(pickup.pickupStatus);
                        const isDone = sIdx >= idx;
                        const historyStep = history.find(h => h.status === step);

                        return (
                          <div key={step} className={`p-2.5 rounded border ${
                            isDone 
                              ? 'bg-green-50 border-green-300 text-green-900' 
                              : 'bg-gray-50 border-gray-200 text-gray-400'
                          }`}>
                            <div className="flex items-center justify-center gap-1 font-bold mb-0.5">
                              {isDone && <Check className="w-3 h-3 text-[#166534]" />}
                              <span>{step}</span>
                            </div>
                            {historyStep && (
                              <p className="text-[10px] text-gray-500 truncate">
                                {new Date(historyStep.changedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Completed Pickups */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700">Completed Deliveries History ({completedPickups.length})</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {completedPickups.length === 0 ? (
            <div className="p-6 text-center text-gray-500 text-sm">No completed deliveries yet.</div>
          ) : (
            completedPickups.map((pickup) => (
              <div key={pickup._id} className="p-4 px-6 flex justify-between items-center text-sm">
                <div>
                  <span className="text-gray-900 font-bold">Pickup #{pickup._id.slice(-6)}</span>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Completed on {new Date(pickup.pickupDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center text-[#166534] font-bold text-xs bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
                  <Check className="w-3.5 h-3.5 mr-1" />
                  {pickup.pickupStatus}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default VolunteerDashboard;

