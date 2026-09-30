import { useNavigationGPS } from '../../context/NavigationContext';
import { hasCoordinates } from '../../lib/coordinates';
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
  const gps = useNavigationGPS();
  const [stopping, setStopping] = useState(false);
  const arrive = async () => {
    setStopping(true);
    try {
      await apiClient.post(`/api/pickups/${pickupId}/tracking/stop`);
      gps.stopWatching(); gps.setActiveNavPickupId(null);
      setDetails(current => current ? { ...current, pickupStatus: 'ARRIVED' } : current);
    } catch (err: any) { toast.error(err.response?.data?.message || 'Could not mark arrival. Please retry.'); }
    finally { setStopping(false); }
  };

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

  const destCoords = hasCoordinates(details?.destinationNgo?.location)
    ? {
        latitude: details.destinationNgo.location.latitude,
        longitude: details.destinationNgo.location.longitude
      }
    : null;

  const {
    liveLocation,
    trackingStatus,
    route,
    connectionStatus,
    lastUpdatedText,
    isStale, errorMessage,
    refreshRoute
  } = useLiveTracking({
    pickupId: pickupId || '',
    destinationCoords: destCoords,
    initialLiveLocation: details?.liveLocation,
    pickupStatus: details?.pickupStatus
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
        <div className="w-10 h-10 border-4 border-[#12B8B0] border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-slate-600 dark:text-slate-400 font-medium text-sm">Connecting to real-time delivery telemetry...</p>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-white/85 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-[0_8px_32px_rgba(18,184,176,0.06)] border border-red-200 text-center my-8">
        <div className="w-12 h-12 bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-300 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <Info className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">Live Tracking Unavailable</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{error || 'Could not load tracking information.'}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-[#12B8B0] hover:bg-[#0EA29B] text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
        >
          Return to Previous View
        </button>
      </div>
    );
  }

  const pickupPoint = hasCoordinates(details.donor?.location) ? {
    latitude: details.donor?.location?.latitude,
    longitude: details.donor?.location?.longitude,
    name: details.donor?.name || 'Origin Food Donor',
    address: details.donor?.location?.address
      ? `${details.donor.location.address}, ${details.donor.location.area || ''}`
      : 'Pickup Address on file'
  } : null;

  const destPoint = hasCoordinates(details.destinationNgo?.location) ? {
    latitude: details.destinationNgo?.location?.latitude,
    longitude: details.destinationNgo?.location?.longitude,
    name: details.destinationNgo?.name || 'Delivery Destination (NGO)',
    address: details.destinationNgo?.location?.address
      ? `${details.destinationNgo.location.address}, ${details.destinationNgo.location.area || ''}`
      : 'NGO Facility Address on file'
  } : null;

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
      {gps.activeNavPickupId === pickupId && (
        <div className="p-4 bg-[#EAF7F5] dark:bg-teal-950/60 border border-[#BCE8E2] dark:border-teal-800/50 rounded-2xl flex flex-wrap justify-between items-center gap-3">
          <span className="text-xs font-semibold text-[#0F766E] dark:text-teal-300" role="status">
            GPS: {gps.gpsError || (gps.currentLocation ? 'Active & Broadcasting' : 'Waiting for device GPS position...')}
          </span>
          <button
            onClick={arrive}
            disabled={stopping}
            className="px-5 py-2 bg-[#12B8B0] hover:bg-[#0EA29B] text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {stopping ? 'Saving arrival...' : 'Mark Arrived at Destination'}
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/85 dark:bg-slate-900/80 backdrop-blur-xl p-5 sm:p-6 rounded-3xl border border-white/90 dark:border-white/10 shadow-[0_8px_32px_rgba(18,184,176,0.06)]">
        <div className="flex items-center gap-3.5">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-[#EAF7F5] dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400 hover:text-[#12B8B0] transition cursor-pointer"
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Live Rescue Tracking #{details.pickupId.slice(-6)}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E1F6F3] dark:bg-teal-950/60 text-[#0F766E] dark:text-teal-300 border border-[#BCE8E2] dark:border-teal-800/40">
                {trackingStatus || details.pickupStatus}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Real-time delivery progress from donor handover to NGO reception
            </p>
          </div>
        </div>

        {/* Live Indicator Pill */}
        <div className="flex items-center gap-3">
          {connectionStatus === 'LIVE' && !isStale && (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#E1F6F3] dark:bg-teal-950/60 text-[#0F766E] dark:text-teal-300 border border-[#BCE8E2] dark:border-teal-800/40 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#12B8B0] animate-pulse"></span>
              LIVE TRACKING
            </span>
          )}

          {connectionStatus === 'RECONNECTING' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
              <RefreshCw className="w-3 h-3 animate-spin text-amber-600" />
              RECONNECTING...
            </span>
          )}

          {isStale && connectionStatus !== 'COMPLETED' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
              <Clock className="w-3 h-3" />
              LOCATION STALE
            </span>
          )}

          {connectionStatus === 'COMPLETED' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              DELIVERY ARRIVED
            </span>
          )}

          <button
            onClick={() => refreshRoute()}
            title="Refresh Route"
            className="p-2 text-slate-500 hover:text-[#12B8B0] hover:bg-[#EAF7F5] dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {errorMessage && <p role="alert" className="text-xs font-semibold text-rose-600 px-2">{errorMessage}</p>}

      {/* Main Grid: Map & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Map Column (2 spans on desktop) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-xl p-3 rounded-3xl shadow-[0_8px_32px_rgba(18,184,176,0.06)] border border-white/90 dark:border-white/10 overflow-hidden">
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
              className="h-[480px] w-full rounded-2xl"
              autoCenter={Boolean(volunteerPoint)}
            />

            {/* Real-Time Last Updated & Device Note */}
            <div className="mt-3 px-4 py-2.5 bg-[#F8FCFB]/80 dark:bg-slate-800/60 rounded-xl flex flex-wrap justify-between items-center text-xs text-slate-500 border border-[#D2EBE6]/70 dark:border-white/5">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[#12B8B0]" />
                <span className="font-semibold text-slate-800 dark:text-slate-200">{lastUpdatedText}</span>
                {liveLocation?.accuracy && (
                  <span className="text-slate-400">
                    (GPS Accuracy: ±{liveLocation.accuracy}m)
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 italic">
                Device GPS via Socket.IO • Real-time telemetry
              </div>
            </div>
          </div>

          {/* Notice Card */}
          <div className="p-4 bg-[#EAF7F5]/80 dark:bg-teal-950/40 border border-[#BCE8E2] dark:border-teal-800/40 rounded-2xl text-xs text-[#0F766E] dark:text-teal-300 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-[#12B8B0] shrink-0 mt-0.5" />
            <p>
              <strong>Active Navigation Scope:</strong> GPS coordinates update dynamically while the volunteer's mobile telemetry page remains active. If the screen sleeps, telemetry resumes upon wake.
            </p>
          </div>
        </div>

        {/* Sidebar Info Column (1 span) */}
        <div className="space-y-4">
          
          {/* ETA & Distance Card */}
          <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-xl p-5 rounded-3xl shadow-[0_8px_32px_rgba(18,184,176,0.06)] border border-white/90 dark:border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-[#D2EBE6]/60 dark:border-white/10 pb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center">
                <Truck className="w-4 h-4 mr-1.5 text-[#12B8B0]" />
                Delivery Navigation
              </h2>
              <span className="text-[11px] font-mono text-[#0F766E] dark:text-teal-300 bg-[#E1F6F3] dark:bg-teal-950/60 px-2 py-0.5 rounded-md border border-[#BCE8E2] dark:border-teal-800/40 font-semibold">
                {route?.provider === 'google' ? 'Google Routes' : 'Road Routing'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-[#EAF7F5]/80 dark:bg-teal-950/40 p-3 rounded-2xl border border-[#BCE8E2] dark:border-teal-800/40">
                <p className="text-xs text-[#0F766E] dark:text-teal-300 font-semibold">Remaining</p>
                <p className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-0.5">
                  {route ? `${route.distanceKm} km` : '--'}
                </p>
              </div>

              <div className="bg-[#EAF7F5]/80 dark:bg-teal-950/40 p-3 rounded-2xl border border-[#BCE8E2] dark:border-teal-800/40">
                <p className="text-xs text-[#0F766E] dark:text-teal-300 font-semibold">Est. Arrival</p>
                <p className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-0.5">
                  {route ? `${route.durationMinutes} min` : '--'}
                </p>
              </div>
            </div>

            {liveLocation?.speed !== undefined && liveLocation.speed !== null && (
              <div className="text-xs text-slate-500 dark:text-slate-400 flex justify-between px-1">
                <span>Volunteer Speed:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{liveLocation.speed} km/h</span>
              </div>
            )}
          </div>

          {/* Assigned Volunteer Card */}
          <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-xl p-5 rounded-3xl shadow-[0_8px_32px_rgba(18,184,176,0.06)] border border-white/90 dark:border-white/10 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Assigned Courier
            </p>
            {details.volunteer ? (
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-base">{details.volunteer.name}</span>
                  <span className="text-xs bg-[#EAF7F5] dark:bg-teal-950/60 text-[#0F766E] dark:text-teal-300 border border-[#BCE8E2] px-2 py-0.5 rounded-lg font-semibold">
                    {details.volunteer.vehicleType || 'Courier Vehicle'}
                  </span>
                </div>
                {details.volunteer.phone && (
                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#12B8B0]" />
                    <a href={`tel:${details.volunteer.phone}`} className="text-[#12B8B0] font-semibold hover:underline">
                      {details.volunteer.phone}
                    </a>
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No volunteer assigned yet</p>
            )}
          </div>

          {/* Destination NGO Card */}
          <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-xl p-5 rounded-3xl shadow-[0_8px_32px_rgba(18,184,176,0.06)] border border-white/90 dark:border-white/10 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-[#0F766E] dark:text-teal-300 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#12B8B0]" />
              Delivery Destination (NGO)
            </p>
            <div className="text-sm space-y-1">
              <p className="font-bold text-slate-900 dark:text-slate-100">{details.destinationNgo.name}</p>
              {details.destinationNgo.location && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {details.destinationNgo.location.address}, {details.destinationNgo.location.area}, {details.destinationNgo.location.city}
                </p>
              )}
              {details.destinationNgo.phone && (
                <p className="text-xs text-slate-400 flex items-center gap-1 pt-1">
                  <Phone className="w-3 h-3 text-[#12B8B0]" />
                  {details.destinationNgo.phone}
                </p>
              )}
            </div>
          </div>

          {/* Donor Location Card */}
          <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-xl p-5 rounded-3xl shadow-[0_8px_32px_rgba(18,184,176,0.06)] border border-white/90 dark:border-white/10 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-[#0F766E] dark:text-teal-300 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#12B8B0]" />
              Origin Food Donor
            </p>
            <div className="text-sm space-y-1">
              <p className="font-bold text-slate-900 dark:text-slate-100">{details.donor.name}</p>
              {details.donor.location && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
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
