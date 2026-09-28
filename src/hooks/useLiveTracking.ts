import { useState, useEffect, useRef, useCallback } from 'react';
import { getSocket, joinPickupRoom, leavePickupRoom } from '../lib/socket';
import { routingClient, type RouteData, type Coordinates } from '../services/routingClient';
import { hasCoordinates } from '../lib/coordinates';
import type { LiveLocationData } from '../types';

export type ConnectionStatus = 'LIVE' | 'WAITING' | 'RECONNECTING' | 'DISCONNECTED' | 'STALE' | 'COMPLETED';
export interface UseLiveTrackingOptions {
  pickupId: string;
  destinationCoords?: Coordinates | null;
  initialLiveLocation?: LiveLocationData | null;
  pickupStatus?: string;
}
export const useLiveTracking = ({ pickupId, destinationCoords, initialLiveLocation, pickupStatus }: UseLiveTrackingOptions) => {
  const [trackingStatus, setTrackingStatus] = useState(pickupStatus);
  const [liveLocation, setLiveLocation] = useState<LiveLocationData | null>(null);
  const [route, setRoute] = useState<RouteData | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('RECONNECTING');
  const [lastUpdatedText, setLastUpdatedText] = useState('Waiting for volunteer GPS...');
  const [isStale, setIsStale] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);
  const latest = useRef<LiveLocationData | null>(null);
  const completed = useRef(false);
  const generation = useRef(0);
  const updateRoute = useCallback(async (coords?: Coordinates | null, force = false) => {
    if (!pickupId) return;
    const version = generation.current;
    try {
      const result = await routingClient.getRoute(pickupId, coords, force);
      if (version === generation.current) { setRoute(result); setRouteError(null); }
    } catch (error: any) {
      if (version === generation.current) {
        setRoute(null);
        setRouteError(error.response?.data?.message || 'Road routing service is unavailable. Please retry.');
      }
    }
  }, [pickupId]);
  useEffect(() => {
    setTrackingStatus(pickupStatus);
    completed.current = ['ARRIVED', 'DELIVERED', 'DISTRIBUTED'].includes(pickupStatus || '');
    if (completed.current) setConnectionStatus('COMPLETED');
  }, [pickupStatus]);
  useEffect(() => {
    if (hasCoordinates(initialLiveLocation) && (!latest.current ||
      Date.parse(initialLiveLocation.updatedAt || '') > Date.parse(latest.current.timestamp || latest.current.updatedAt || ''))) {
      latest.current = initialLiveLocation;
      setLiveLocation(initialLiveLocation);
    }
  }, [initialLiveLocation]);
  useEffect(() => {
    generation.current++;
    latest.current = null;
    setLiveLocation(null); setRoute(null); setErrorMessage(null); setRouteError(null);
    setIsStale(false); setConnectionStatus('RECONNECTING');
    if (!pickupId) return;
    const socket = getSocket();
    let active = true;
    let roomJoined = false;
    const tick = () => {
      if (completed.current) { setConnectionStatus('COMPLETED'); setIsStale(false); setLastUpdatedText('Tracking ended'); return; }
      const ts = Date.parse(latest.current?.timestamp || latest.current?.updatedAt || '');
      const seconds = Math.max(0, Math.floor((Date.now() - ts) / 1000));
      const stale = Number.isFinite(seconds) && seconds > 25;
      setIsStale(stale);
      setLastUpdatedText(!Number.isFinite(seconds) ? 'Waiting for volunteer GPS...' : seconds < 4 ? 'Updated just now' : `Updated ${seconds}s ago`);
      if (socket.connected && roomJoined) setConnectionStatus(!latest.current ? 'WAITING' : stale ? 'STALE' : 'LIVE');
    };
    const accept = (data: LiveLocationData) => {
      if (!active || data.pickupId !== pickupId || !hasCoordinates(data)) return;
      const time = Date.parse(data.timestamp || data.updatedAt || '');
      const previous = Date.parse(latest.current?.timestamp || latest.current?.updatedAt || '');
      if (Number.isFinite(previous) && time < previous) return;
      latest.current = data; setLiveLocation(data); tick();
      void updateRoute(data);
    };
    const connect = () => { joinPickupRoom(pickupId); setConnectionStatus('RECONNECTING'); };
    const joined = (data: any) => {
      if (data.pickupId !== pickupId) return;
      roomJoined = true;
      setTrackingStatus(data.pickupStatus);
      completed.current = ['ARRIVED', 'DELIVERED', 'DISTRIBUTED'].includes(data.pickupStatus);
      setErrorMessage(null);
      if (data.latestLocation) accept(data.latestLocation);
      tick();
    };
    const stopped = (data: any) => { if (data.pickupId === pickupId) { completed.current = true; setTrackingStatus(data.status); tick(); } };
    const started = (data: any) => { if (data.pickupId === pickupId) { completed.current = false; setTrackingStatus(data.status); tick(); } };
    const disconnected = () => { roomJoined = false; setConnectionStatus('RECONNECTING'); };
    const failed = (error?: any) => { roomJoined = false; setConnectionStatus('DISCONNECTED'); setErrorMessage(error?.message || 'Connection lost'); };
    const trackingError = (error: any) => { if (!error.pickupId || error.pickupId === pickupId) failed(error); };
    socket.on('connect', connect); socket.on('disconnect', disconnected); socket.on('connect_error', failed);
    socket.on('tracking:joined', joined); socket.on('volunteer:location', accept);
    socket.on('tracking:stopped', stopped); socket.on('tracking:started', started); socket.on('tracking:error', trackingError);
    socket.io.on('reconnect_failed', failed);
    if (socket.connected) connect();
    const timer = setInterval(tick, 1000);
    return () => {
      active = false; generation.current++; clearInterval(timer); leavePickupRoom(pickupId);
      socket.off('connect', connect); socket.off('disconnect', disconnected); socket.off('connect_error', failed);
      socket.off('tracking:joined', joined); socket.off('volunteer:location', accept);
      socket.off('tracking:stopped', stopped); socket.off('tracking:started', started); socket.off('tracking:error', trackingError);
      socket.io.off('reconnect_failed', failed);
    };
  }, [pickupId, updateRoute]);
  useEffect(() => {
    if (hasCoordinates(destinationCoords)) void updateRoute(latest.current);
  }, [destinationCoords?.latitude, destinationCoords?.longitude, updateRoute]);
  return { trackingStatus, liveLocation, route, connectionStatus, lastUpdatedText, isStale,
    errorMessage: errorMessage || routeError, refreshRoute: () => updateRoute(latest.current, true) };
};
