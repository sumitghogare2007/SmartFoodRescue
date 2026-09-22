import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/api';
import { useLiveTracking } from '../../hooks/useLiveTracking';
import { LiveTrackingMap } from '../../components/tracking/LiveTrackingMap';
import type { PickupTrackingDetails } from '../../types';
import {
  Truck,
  MapPin,
  Clock,
  Phone,
  ArrowLeft,
  RefreshCw,
  Info,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';

export const LiveTrackingPage: React.FC = () => {
  const { pickupId } = useParams<{ pickupId: string }>();
  const navigate = useNavigate();

  const [details, setDetails] = useState<PickupTrackingDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial pickup and location metadata
  useEffect(() => {
    if (!pickupId) return;

    const fetchTrackingData = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get(`/api/pickups/${pickupId}/tracking`);
        setDetails(res.data);
        setError(null);
      } catch (err: any) {
        const msg = err.response?.data?.message || 'Failed to load tracking information';
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchTrackingData();
  }, [pickupId]);

  const destCoords = details?.destinationNgo?.location
    ? {
        latitude: details.destinationNgo.location.latitude || 19.076,
        longitude: details.destinationNgo.location.longitude || 72.8777
      }
    : null;

  const {
    liveLocation,
    route,
    connectionStatus,
    lastUpdatedText,
    isStale,
    refreshRoute
  } = useLiveTracking({
    pickupId: pickupId || '',
    destinationCoords: destCoords,
    initialLiveLocation: details?.liveLocation
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
        <div className="w-10 h-10 border-4 border-[#166534] border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-gray-600 font-medium text-sm">Connecting to real-time delivery tracking...</p>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-red-200 text-center my-8">
        <div className="w-12 h-12 bg-red-100 text-red-700 rounded-full flex items-center justify-center mx-auto mb-3">
          <Info className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">Live Tracking Unavailable</h2>
        <p className="text-sm text-gray-600 mb-4">{error || 'Could not load tracking information.'}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-[#166534] text-white rounded-md text-xs font-bold hover:bg-green-800 transition"
        >
          Go Back
        </button>
      </div>
    );
  }

  const pickupPoint = {
    latitude: details.donor?.location?.latitude || 19.1197,
    longitude: details.donor?.location?.longitude || 72.8464,
    name: details.donor?.name || 'Origin Food Donor',
    address: details.donor?.location?.address
      ? `${details.donor.location.address}, ${details.donor.location.area || ''}`
      : 'Pickup Address on file'
  };

  const destPoint = {
    latitude: details.destinationNgo?.location?.latitude || 19.076,
    longitude: details.destinationNgo?.location?.longitude || 72.8777,
    name: details.destinationNgo?.name || 'Delivery Destination (NGO)',
    address: details.destinationNgo?.location?.address
      ? `${details.destinationNgo.location.address}, ${details.destinationNgo.location.area || ''}`
      : 'NGO Facility Address on file'
  };

  const volunteerPoint = liveLocation
    ? {
        latitude: liveLocation.latitude,
        longitude: liveLocation.longitude,
        heading: liveLocation.heading ?? null,
        accuracy: liveLocation.accuracy,
        speed: liveLocation.speed ?? null
      }
    : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-xs border border-gray-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition"
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[#1e3a5f]">
                Live Rescue Tracking #{details.pickupId.slice(-6)}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                {details.pickupStatus}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Real-time delivery progress from donor handover to NGO reception
            </p>
          </div>
        </div>

        {/* Live Indicator Pill */}
        <div className="flex items-center gap-3">
          {connectionStatus === 'LIVE' && !isStale && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              LIVE TRACKING
            </span>
          )}

          {connectionStatus === 'RECONNECTING' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-300">
              <RefreshCw className="w-3 h-3 animate-spin" />
              RECONNECTING...
            </span>
          )}

          {isStale && connectionStatus !== 'COMPLETED' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
              <Clock className="w-3 h-3" />
              LOCATION STALE
            </span>
          )}

          {connectionStatus === 'COMPLETED' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
              <CheckCircle2 className="w-3.5 h-3.5" />
              DELIVERY ARRIVED
            </span>
          )}

          <button
            onClick={() => refreshRoute()}
            title="Refresh Route"
            className="p-2 text-gray-600 hover:text-emerald-700 hover:bg-gray-100 rounded-lg transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Grid: Map & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Map Column (2 spans on desktop) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-3 rounded-xl shadow-xs border border-gray-200 overflow-hidden">
            <LiveTrackingMap
              volunteerLocation={volunteerPoint}
              pickupLocation={pickupPoint}
              destinationLocation={destPoint}
              route={route}
              distanceKm={route?.distanceKm}
              durationMinutes={route?.durationMinutes}
              lastUpdatedText={lastUpdatedText}
              connectionStatus={connectionStatus}
              isStale={isStale}
              className="h-[480px] w-full rounded-lg"
              autoCenter={Boolean(volunteerPoint)}
            />

            {/* Real-Time Last Updated & Device Note */}
            <div className="mt-3 px-3 py-2 bg-gray-50 rounded-lg flex flex-wrap justify-between items-center text-xs text-gray-600 border border-gray-100">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-gray-500" />
                <span className="font-semibold text-gray-800">{lastUpdatedText}</span>
                {liveLocation?.accuracy && (
                  <span className="text-gray-400">
                    (GPS Accuracy: ±{liveLocation.accuracy}m)
                  </span>
                )}
              </div>
              <div className="text-[11px] text-gray-400 italic">
                Device GPS via Socket.IO • No artificial simulation
              </div>
            </div>
          </div>

          {/* Active Browser Limitation Notice (Requirement #11) */}
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs text-blue-800 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p>
              <strong>Active Navigation Scope:</strong> GPS coordinates update in real time while the volunteer's mobile browser tracking page remains active. If the device screen turns off or the browser is minimized, coordinates resume immediately upon reopening.
            </p>
          </div>
        </div>

        {/* Sidebar Info Column (1 span) */}
        <div className="space-y-4">
          
          {/* ETA & Distance Card */}
          <div className="bg-white p-5 rounded-xl shadow-xs border border-gray-200 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center">
                <Truck className="w-4 h-4 mr-1.5 text-emerald-700" />
                Delivery Navigation
              </h2>
              <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                {route?.provider === 'google' ? 'Google Routes' : 'Road Routing'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-emerald-50/60 p-3 rounded-lg border border-emerald-100">
                <p className="text-xs text-emerald-800 font-semibold">Remaining Distance</p>
                <p className="text-2xl font-black text-gray-900 mt-0.5">
                  {route ? `${route.distanceKm} km` : '--'}
                </p>
              </div>

              <div className="bg-blue-50/60 p-3 rounded-lg border border-blue-100">
                <p className="text-xs text-blue-800 font-semibold">Estimated Arrival</p>
                <p className="text-2xl font-black text-gray-900 mt-0.5">
                  {route ? `${route.durationMinutes} min` : '--'}
                </p>
              </div>
            </div>

            {liveLocation?.speed !== undefined && liveLocation.speed !== null && (
              <div className="text-xs text-gray-500 flex justify-between px-1">
                <span>Volunteer Current Speed:</span>
                <span className="font-bold text-gray-800">{liveLocation.speed} km/h</span>
              </div>
            )}
          </div>

          {/* Assigned Volunteer Card */}
          <div className="bg-white p-5 rounded-xl shadow-xs border border-gray-200 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Assigned Courier
            </p>
            {details.volunteer ? (
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900 text-base">{details.volunteer.name}</span>
                  <span className="text-xs bg-gray-100 px-2 py-0.5 rounded font-semibold text-gray-700">
                    {details.volunteer.vehicleType || 'Courier Vehicle'}
                  </span>
                </div>
                {details.volunteer.phone && (
                  <p className="text-xs text-gray-600 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    <a href={`tel:${details.volunteer.phone}`} className="text-emerald-700 font-semibold hover:underline">
                      {details.volunteer.phone}
                    </a>
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">No volunteer assigned yet</p>
            )}
          </div>

          {/* Destination NGO Card */}
          <div className="bg-white p-5 rounded-xl shadow-xs border border-gray-200 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-purple-900 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-purple-700" />
              Delivery Destination (NGO)
            </p>
            <div className="text-sm space-y-1">
              <p className="font-bold text-gray-900">{details.destinationNgo.name}</p>
              {details.destinationNgo.location && (
                <p className="text-xs text-gray-600">
                  {details.destinationNgo.location.address}, {details.destinationNgo.location.area}, {details.destinationNgo.location.city}
                </p>
              )}
              {details.destinationNgo.phone && (
                <p className="text-xs text-gray-500 flex items-center gap-1 pt-1">
                  <Phone className="w-3 h-3 text-gray-400" />
                  {details.destinationNgo.phone}
                </p>
              )}
            </div>
          </div>

          {/* Donor Location Card */}
          <div className="bg-white p-5 rounded-xl shadow-xs border border-gray-200 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              Origin Food Donor
            </p>
            <div className="text-sm space-y-1">
              <p className="font-bold text-gray-900">{details.donor.name}</p>
              {details.donor.location && (
                <p className="text-xs text-gray-600">
                  {details.donor.location.address}, {details.donor.location.area}, {details.donor.location.city}
                </p>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default LiveTrackingPage;
