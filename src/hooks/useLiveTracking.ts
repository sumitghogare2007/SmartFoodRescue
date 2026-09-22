import { useState, useEffect, useRef, useCallback } from 'react';
import { getSocket, joinPickupRoom, leavePickupRoom } from '../lib/socket';
import { routingClient } from '../services/routingClient';
import type { RouteData, Coordinates } from '../services/routingClient';
import type { LiveLocationData } from '../types';

export type ConnectionStatus = 'LIVE' | 'RECONNECTING' | 'DISCONNECTED' | 'STALE' | 'COMPLETED';

export interface UseLiveTrackingOptions {
  pickupId: string;
  destinationCoords?: Coordinates | null;
  initialLiveLocation?: LiveLocationData | null;
}

export const useLiveTracking = ({
  pickupId,
  destinationCoords,
  initialLiveLocation
}: UseLiveTrackingOptions) => {
  const [liveLocation, setLiveLocation] = useState<LiveLocationData | null>(initialLiveLocation || null);
  const [route, setRoute] = useState<RouteData | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('RECONNECTING');
  const [lastUpdatedText, setLastUpdatedText] = useState<string>('Connecting...');
  const [isStale, setIsStale] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const lastLocationTimestampRef = useRef<number>(
    initialLiveLocation?.updatedAt ? new Date(initialLiveLocation.updatedAt).getTime() : 0
  );
  const isMountedRef = useRef<boolean>(true);

  // Fetch / update route via decoupled routing service
  const updateRoute = useCallback(
    async (coords?: Coordinates | null, force = false) => {
      if (!pickupId) return;
      const calculatedRoute = await routingClient.getRoute(pickupId, coords, force);
      if (isMountedRef.current && calculatedRoute) {
        setRoute(calculatedRoute);
      }
    },
    [pickupId]
  );

  // Periodic ticker for relative "Updated X seconds ago" and stale location detection
  useEffect(() => {
    const interval = setInterval(() => {
      const lastTs = lastLocationTimestampRef.current;
      if (!lastTs) {
        setLastUpdatedText('Waiting for volunteer location...');
        return;
      }

      const diffSec = Math.floor((Date.now() - lastTs) / 1000);

      if (diffSec > 25) {
        setIsStale(true);
        setLastUpdatedText('Location temporarily unavailable');
        setConnectionStatus((prev) => (prev === 'LIVE' ? 'STALE' : prev));
      } else {
        setIsStale(false);
        if (diffSec < 4) {
          setLastUpdatedText('Updated just now');
        } else {
          setLastUpdatedText(`Updated ${diffSec}s ago`);
        }
        setConnectionStatus((prev) => (prev === 'STALE' ? 'LIVE' : prev));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Socket.IO Room Lifecycle
  useEffect(() => {
    isMountedRef.current = true;
    if (!pickupId) return;

    const socket = getSocket();

    const handleConnect = () => {
      if (!isMountedRef.current) return;
      joinPickupRoom(pickupId);
      setConnectionStatus(isStale ? 'STALE' : 'LIVE');
      setErrorMessage(null);
    };

    const handleDisconnect = () => {
      if (!isMountedRef.current) return;
      setConnectionStatus('RECONNECTING');
      setLastUpdatedText('Reconnecting...');
    };

    const handleReconnectAttempt = () => {
      if (!isMountedRef.current) return;
      setConnectionStatus('RECONNECTING');
      setLastUpdatedText('Reconnecting to live feed...');
    };

    const handleJoined = (data: any) => {
      if (!isMountedRef.current) return;
      if (data.latestLocation) {
        const loc = data.latestLocation;
        setLiveLocation(loc);
        lastLocationTimestampRef.current = new Date(loc.updatedAt || loc.createdAt).getTime();
        setConnectionStatus('LIVE');

        // Request initial route
        updateRoute({ latitude: loc.latitude, longitude: loc.longitude });
      } else {
        setLastUpdatedText('Awaiting volunteer navigation start');
      }
    };

    const handleVolunteerLocation = (data: LiveLocationData) => {
      if (!isMountedRef.current) return;
      setLiveLocation(data);
      const ts = data.timestamp ? new Date(data.timestamp).getTime() : Date.now();
      lastLocationTimestampRef.current = ts;
      setIsStale(false);
      setConnectionStatus('LIVE');
      setLastUpdatedText('Updated just now');

      // Smart reroute: check if meaningful movement or off-route occurred
      if (routingClient.shouldRecalculate(pickupId, { latitude: data.latitude, longitude: data.longitude })) {
        updateRoute({ latitude: data.latitude, longitude: data.longitude });
      }
    };

    const handleTrackingStopped = () => {
      if (!isMountedRef.current) return;
      setConnectionStatus('COMPLETED');
      setLastUpdatedText('Volunteer arrived at destination');
    };

    const handleTrackingError = (err: any) => {
      if (!isMountedRef.current) return;
      setErrorMessage(err.message || 'Tracking error');
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.io.on('reconnect_attempt', handleReconnectAttempt);
    socket.on('tracking:joined', handleJoined);
    socket.on('volunteer:location', handleVolunteerLocation);
    socket.on('tracking:stopped', handleTrackingStopped);
    socket.on('tracking:error', handleTrackingError);

    // Initial join
    if (socket.connected) {
      handleConnect();
    } else {
      socket.connect();
    }

    return () => {
      isMountedRef.current = false;
      leavePickupRoom(pickupId);
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.io.off('reconnect_attempt', handleReconnectAttempt);
      socket.off('tracking:joined', handleJoined);
      socket.off('volunteer:location', handleVolunteerLocation);
      socket.off('tracking:stopped', handleTrackingStopped);
      socket.off('tracking:error', handleTrackingError);
    };
  }, [pickupId, isStale, updateRoute]);

  // Initial route fetch on mount if destination is available
  useEffect(() => {
    if (destinationCoords) {
      updateRoute(
        liveLocation ? { latitude: liveLocation.latitude, longitude: liveLocation.longitude } : null
      );
    }
  }, [destinationCoords, updateRoute]);

  return {
    liveLocation,
    route,
    connectionStatus,
    lastUpdatedText,
    isStale,
    errorMessage,
    refreshRoute: () => updateRoute(liveLocation ? { latitude: liveLocation.latitude, longitude: liveLocation.longitude } : null, true)
  };
};
