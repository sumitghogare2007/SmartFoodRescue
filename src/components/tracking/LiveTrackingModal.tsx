import React from 'react';
import { Modal } from '../ui/Modal';
import { LiveTrackingMap } from './LiveTrackingMap';
import { useLiveTracking } from '../../hooks/useLiveTracking';
import type { PickupTrackingDetails } from '../../types';
import { MapPin, Clock, ExternalLink, RefreshCw, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LiveTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  pickupId: string | null;
  details: PickupTrackingDetails | null;
}

export const LiveTrackingModal: React.FC<LiveTrackingModalProps> = ({
  isOpen,
  onClose,
  pickupId,
  details
}) => {
  const navigate = useNavigate();

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
    isStale
  } = useLiveTracking({
    pickupId: isOpen && pickupId ? pickupId : '',
    destinationCoords: destCoords,
    initialLiveLocation: details?.liveLocation
  });

  if (!isOpen || !pickupId) return null;

  const pickupPoint = details?.donor?.location
    ? {
        latitude: details.donor.location.latitude || 19.1197,
        longitude: details.donor.location.longitude || 72.8464,
        name: details.donor.name
      }
    : null;

  const destPoint = details?.destinationNgo?.location
    ? {
        latitude: details.destinationNgo.location.latitude || 19.076,
        longitude: details.destinationNgo.location.longitude || 72.8777,
        name: details.destinationNgo.name
      }
    : null;

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Live Volunteer Tracking #${pickupId.slice(-6)}`}
      size="xl"
    >
      <div className="space-y-4">
        {/* Status Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs">
          <div className="flex items-center gap-2">
            {connectionStatus === 'LIVE' && !isStale && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                LIVE
              </span>
            )}
            {isStale && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-300">
                <AlertTriangle className="w-3 h-3" />
                STALE LOCATION
              </span>
            )}
            {connectionStatus === 'RECONNECTING' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold bg-yellow-100 text-yellow-800 border border-yellow-300">
                <RefreshCw className="w-3 h-3 animate-spin" />
                CONNECTING
              </span>
            )}
            <span className="text-gray-600 font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              {lastUpdatedText}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {route && (
              <div className="flex items-center gap-2 font-mono">
                <span className="text-gray-500">Dist:</span>
                <span className="font-bold text-gray-900">{route.distanceKm} km</span>
                <span className="text-gray-300">|</span>
                <span className="text-gray-500">ETA:</span>
                <span className="font-bold text-emerald-700">{route.durationMinutes} min</span>
              </div>
            )}
            <button
              onClick={() => {
                onClose();
                navigate(`/tracking/${pickupId}`);
              }}
              className="px-2.5 py-1 text-emerald-700 hover:bg-emerald-50 rounded border border-emerald-200 font-bold flex items-center gap-1"
            >
              Full Screen
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Map View */}
        <LiveTrackingMap
          volunteerLocation={volunteerPoint}
          pickupLocation={pickupPoint}
          destinationLocation={destPoint}
          route={route}
          className="h-80 w-full rounded-lg"
          autoCenter={Boolean(volunteerPoint)}
        />

        {/* Logistics Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-100">
            <p className="font-bold text-indigo-900 mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-indigo-700" />
              Pickup (Donor)
            </p>
            <p className="font-semibold text-gray-900">{details?.donor?.name || 'Food Donor'}</p>
            {details?.donor?.location && (
              <p className="text-gray-600 mt-0.5">
                {details.donor.location.address}, {details.donor.location.area}
              </p>
            )}
          </div>

          <div className="p-3 bg-purple-50/50 rounded-lg border border-purple-100">
            <p className="font-bold text-purple-900 mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-purple-700" />
              Destination (NGO)
            </p>
            <p className="font-semibold text-gray-900">{details?.destinationNgo?.name || 'NGO Partner'}</p>
            {details?.destinationNgo?.location && (
              <p className="text-gray-600 mt-0.5">
                {details.destinationNgo.location.address}, {details.destinationNgo.location.area}
              </p>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
