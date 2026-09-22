import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { volunteerService } from '../../services/volunteerService';
import { apiClient } from '../../lib/api';
import type { Pickup, StatusHistoryEntry } from '../../types';
import {
  Truck,
  MapPin,
  Package,
  Check,
  Loader,
  Building2,
  Phone,
  Calendar,
  Navigation,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useRealtimeSync } from '../../hooks/useRealtimeSync';
import { useDeviceGPS } from '../../hooks/useDeviceGPS';

const VolunteerDashboard = () => {
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [historyMap, setHistoryMap] = useState<Record<string, StatusHistoryEntry[]>>({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeNavPickupId, setActiveNavPickupId] = useState<string | null>(null);

  // Hook real device GPS (active when a pickup is in EN_ROUTE)
  const {
    currentLocation,
    isWatching,
    permissionStatus,
    gpsError
  } = useDeviceGPS({
    pickupId: activeNavPickupId || undefined,
    enabled: Boolean(activeNavPickupId),
    onError: (err) => toast.error(err)
  });

  useEffect(() => {
    fetchPickups();
  }, []);

  useRealtimeSync({
    onSync: () => fetchPickups(),
    events: ['pickup:updated', 'distribution:completed', 'request:accepted'],
  });

  const fetchPickups = async () => {
    try {
      const data = await volunteerService.getMyPickups();
      setPickups(data);

      // Check if any pickup is currently EN_ROUTE
      const enRoute = data.find((p: Pickup) => p.pickupStatus === 'EN_ROUTE');
      if (enRoute) {
        setActiveNavPickupId(enRoute._id);
      } else {
        setActiveNavPickupId(null);
      }

      // Load tracking history for active pickups
      const histories: Record<string, StatusHistoryEntry[]> = {};
      await Promise.all(
        data.map(async (p: Pickup) => {
          try {
            const h = await volunteerService.getTrackingHistory(p._id);
            histories[p._id] = h;
          } catch {
            histories[p._id] = p.statusHistory || [];
          }
        })
      );
      setHistoryMap(histories);
    } catch {
      toast.error('Failed to load assigned pickups');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setActionLoading(id);
    try {
      if (newStatus === 'ASSIGNED') {
        await apiClient.put(`/api/pickups/${id}/assign-volunteer`, {});
        toast.success('Assignment accepted!');
      } else {
        await volunteerService.updatePickupStatus(id, newStatus);
        toast.success(`Status updated: ${newStatus}`);
      }
      await fetchPickups();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setActionLoading(null);
    }
  };

  // Start Navigation -> Moves to EN_ROUTE & turns on live GPS tracking
  const handleStartNavigation = async (id: string) => {
    setActionLoading(id);
    try {
      if (!('geolocation' in navigator)) {
        toast.error('Geolocation is not supported by your browser.');
        return;
      }

      // Quick location sample if available
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            await apiClient.post(`/api/pickups/${id}/tracking/start`, {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
              speed: pos.coords.speed,
              heading: pos.coords.heading
            });
            setActiveNavPickupId(id);
            toast.success('Live GPS navigation started! Coordinates broadcasting.');
            await fetchPickups();
          } catch (e: any) {
            toast.error(e.response?.data?.message || 'Failed to start navigation');
          } finally {
            setActionLoading(null);
          }
        },
        async (err) => {
          // If immediate lock times out, still initiate session and let watcher connect
          try {
            await apiClient.post(`/api/pickups/${id}/tracking/start`, {});
            setActiveNavPickupId(id);
            toast.success('Live tracking activated. Acquiring GPS lock...');
            await fetchPickups();
          } catch (e: any) {
            toast.error(e.response?.data?.message || err.message || 'Failed to start navigation');
          } finally {
            setActionLoading(null);
          }
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to start navigation');
      setActionLoading(null);
    }
  };

  // Arrived -> Moves to ARRIVED & turns off GPS tracking
  const handleStopNavigation = async (id: string) => {
    setActionLoading(id);
    try {
      await apiClient.post(`/api/pickups/${id}/tracking/stop`);
      setActiveNavPickupId(null);
      toast.success('Arrived at destination! GPS tracking stopped.');
      await fetchPickups();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to stop tracking');
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
          <p className="text-sm text-gray-500 mt-0.5">View your assigned pickups and transmit live rescue navigation</p>
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
                        <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${
                          pickup.pickupStatus === 'EN_ROUTE' 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 animate-pulse'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {pickup.pickupStatus}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 flex items-center mt-1">
                        <Calendar className="w-3.5 h-3.5 mr-1 text-gray-400" />
                        Scheduled: {new Date(pickup.pickupDate || pickup.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Strict Linear Action Buttons */}
                    <div className="flex items-center gap-2">
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

                      {/* 1. ASSIGNED -> RECEIVED */}
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

                      {/* 2. RECEIVED -> DISPATCHED */}
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

                      {/* 3. DISPATCHED -> EN_ROUTE (Start Navigation) */}
                      {pickup.pickupStatus === 'DISPATCHED' && (
                        <button
                          onClick={() => handleStartNavigation(pickup._id)}
                          disabled={actionLoading === pickup._id}
                          className="px-4 py-2 bg-emerald-700 text-white rounded text-xs font-bold hover:bg-emerald-800 disabled:opacity-50 flex items-center shadow-md gap-1.5 transition"
                        >
                          {actionLoading === pickup._id ? (
                            <Loader className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Navigation className="w-3.5 h-3.5" />
                          )}
                          Start Navigation
                        </button>
                      )}

                      {/* 4. EN_ROUTE -> ARRIVED */}
                      {pickup.pickupStatus === 'EN_ROUTE' && (
                        <button
                          onClick={() => handleStopNavigation(pickup._id)}
                          disabled={actionLoading === pickup._id}
                          className="px-4 py-2 bg-purple-700 text-white rounded text-xs font-bold hover:bg-purple-800 disabled:opacity-50 flex items-center shadow-md gap-1.5 transition"
                        >
                          {actionLoading === pickup._id ? (
                            <Loader className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          Arrived
                        </button>
                      )}

                      {/* 5. ARRIVED -> DELIVERED */}
                      {pickup.pickupStatus === 'ARRIVED' && (
                        <button
                          onClick={() => handleUpdateStatus(pickup._id, 'DELIVERED')}
                          disabled={actionLoading === pickup._id}
                          className="px-4 py-2 bg-[#166534] text-white rounded text-xs font-bold hover:bg-green-800 disabled:opacity-50 flex items-center shadow-sm"
                        >
                          {actionLoading === pickup._id ? <Loader className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Check className="w-3.5 h-3.5 mr-1.5" />}
                          Food Delivered
                        </button>
                      )}

                      {/* Live Tracking Page Link */}
                      {['DISPATCHED', 'EN_ROUTE', 'ARRIVED'].includes(pickup.pickupStatus) && (
                        <Link
                          to={`/tracking/${pickup._id}`}
                          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-bold flex items-center gap-1 transition"
                        >
                          Map <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Active Live Tracking Banner (Section 10, 19) */}
                  {pickup.pickupStatus === 'EN_ROUTE' && (
                    <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
                          <span className="font-bold text-emerald-950 text-sm">
                            🚚 Live Tracking Active
                          </span>
                        </div>
                        <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-mono font-semibold">
                          GPS: {isWatching ? 'Broadcasting Real-Time' : 'Connecting...'}
                        </span>
                      </div>

                      <p className="text-xs text-emerald-800">
                        Your real device GPS coordinates are being transmitted securely to the authorized NGO and donor.
                      </p>

                      {currentLocation && (
                        <div className="flex flex-wrap gap-4 text-xs font-mono bg-white/70 p-2.5 rounded border border-emerald-200">
                          <div>
                            <span className="text-gray-500">Lat: </span>
                            <span className="font-bold text-gray-800">{currentLocation.latitude.toFixed(5)}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Lng: </span>
                            <span className="font-bold text-gray-800">{currentLocation.longitude.toFixed(5)}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Speed: </span>
                            <span className="font-bold text-gray-800">{currentLocation.speed ? `${currentLocation.speed} km/h` : '0 km/h'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Accuracy: </span>
                            <span className="font-bold text-gray-800">±{currentLocation.accuracy}m</span>
                          </div>
                        </div>
                      )}

                      {permissionStatus === 'denied' && (
                        <div className="p-2.5 bg-red-50 text-red-800 text-xs rounded border border-red-200 flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                          <span>Location permission is blocked. Please enable GPS permissions in browser settings.</span>
                        </div>
                      )}

                      {gpsError && (
                        <p className="text-xs text-amber-700 italic">{gpsError}</p>
                      )}

                      <div className="flex justify-end pt-1">
                        <Link
                          to={`/tracking/${pickup._id}`}
                          className="text-xs font-bold text-emerald-800 hover:text-emerald-950 underline flex items-center gap-1"
                        >
                          View Full Screen Live Map <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  )}

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

                  {/* Pickup & Destination Addresses */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* Donor Pickup */}
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <div className="flex items-center text-[#166534] font-bold mb-1">
                        <MapPin className="w-3.5 h-3.5 mr-1 text-[#166534]" />
                        <span>Pickup Location (Donor)</span>
                      </div>
                      <p className="font-semibold text-gray-900">{donor?.organizationName || donor?.contactName || 'Donor'}</p>
                      <p className="text-gray-600 mt-0.5">
                        {donorLoc ? `${donorLoc.address}, ${donorLoc.area}, ${donorLoc.city}` : 'Address on file'}
                      </p>
                      <div className="flex items-center text-gray-500 mt-1.5">
                        <Phone className="w-3.5 h-3.5 text-gray-400 mr-1 flex-shrink-0" />
                        <span>Contact: {donor?.contactPhone || 'N/A'}</span>
                      </div>
                    </div>

                    {/* NGO Delivery */}
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <div className="flex items-center text-purple-700 font-bold mb-1">
                        <Building2 className="w-3.5 h-3.5 mr-1 text-purple-700" />
                        <span>Delivery Destination (NGO)</span>
                      </div>
                      <p className="font-semibold text-gray-900">{ngo?.ngoName || 'NGO Partner'}</p>
                      <p className="text-gray-600 mt-0.5">
                        {ngoLoc ? `${ngoLoc.address}, ${ngoLoc.area}, ${ngoLoc.city}` : 'NGO Center on file'}
                      </p>
                      <div className="flex items-center text-gray-500 mt-1.5">
                        <Phone className="w-3.5 h-3.5 text-gray-400 mr-1 flex-shrink-0" />
                        <span>Contact: {ngo?.contactNo || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Tracking Timeline (Requirement #7: Exact sequence) */}
                  <div className="pt-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Tracking Timeline</p>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
                      {['ASSIGNED', 'RECEIVED', 'DISPATCHED', 'EN_ROUTE', 'ARRIVED', 'DELIVERED'].map((step, idx, arr) => {
                        const sIdx = arr.indexOf(pickup.pickupStatus);
                        const isDone = sIdx >= idx;
                        const historyStep = history.find(h => h.status === step);

                        return (
                          <div key={step} className={`p-2 rounded border ${
                            isDone 
                              ? 'bg-green-50 border-green-300 text-green-900' 
                              : 'bg-gray-50 border-gray-200 text-gray-400'
                          }`}>
                            <div className="flex items-center justify-center gap-1 font-bold mb-0.5 text-[11px]">
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

      {/* Completed Rescues */}
      {completedPickups.length > 0 && (
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700">
              Completed Pickups ({completedPickups.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {completedPickups.map((pickup) => (
              <div key={pickup._id} className="p-4 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-gray-900">Pickup #{pickup._id.slice(-6)}</span>
                  <p className="text-gray-500 mt-0.5">Completed: {new Date(pickup.pickupDate || pickup.createdAt).toLocaleDateString()}</p>
                </div>
                <span className="px-2.5 py-0.5 bg-green-50 text-green-800 border border-green-200 font-bold rounded-full">
                  {pickup.pickupStatus}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VolunteerDashboard;
