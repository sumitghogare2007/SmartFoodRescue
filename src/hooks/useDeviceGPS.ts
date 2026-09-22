import { useState, useEffect, useRef, useCallback } from 'react';
import { emitVolunteerLocation } from '../lib/socket';
import { calculateHaversineDistance } from '../services/routingClient';

export interface DeviceLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number | null;
  heading: number | null;
  timestamp: number;
}

export interface UseDeviceGPSOptions {
  pickupId?: string;
  enabled?: boolean;
  throttleIntervalMs?: number; // default 2500ms
  minMovementMeters?: number; // default 3 meters
  onLocationUpdate?: (location: DeviceLocation) => void;
  onError?: (errorMessage: string) => void;
}

export const useDeviceGPS = ({
  pickupId,
  enabled = false,
  throttleIntervalMs = 2500,
  minMovementMeters = 3,
  onLocationUpdate,
  onError
}: UseDeviceGPSOptions) => {
  const [currentLocation, setCurrentLocation] = useState<DeviceLocation | null>(null);
  const [isWatching, setIsWatching] = useState<boolean>(false);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt' | 'unsupported'>('prompt');
  const [gpsError, setGpsError] = useState<string | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const lastEmitTimeRef = useRef<number>(0);
  const lastEmittedLocationRef = useRef<DeviceLocation | null>(null);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsWatching(false);
  }, []);

  const handlePositionSuccess = useCallback(
    (position: GeolocationPosition) => {
      const { latitude, longitude, accuracy, speed, heading } = position.coords;
      const timestamp = position.timestamp || Date.now();

      const loc: DeviceLocation = {
        latitude,
        longitude,
        accuracy: Math.round(accuracy || 0),
        speed: speed !== null && !isNaN(speed) ? Math.max(0, Number((speed * 3.6).toFixed(1))) : null, // km/h
        heading: heading !== null && !isNaN(heading) ? Math.round(heading) : null,
        timestamp
      };

      setCurrentLocation(loc);
      setGpsError(null);
      setPermissionStatus('granted');

      const now = Date.now();
      const elapsed = now - lastEmitTimeRef.current;

      // Distance from last emitted position
      let hasMovedSignificantly = true;
      if (lastEmittedLocationRef.current) {
        const dist = calculateHaversineDistance(
          lastEmittedLocationRef.current.latitude,
          lastEmittedLocationRef.current.longitude,
          latitude,
          longitude
        );
        hasMovedSignificantly = dist >= minMovementMeters;
      }

      // Throttle GPS updates to Socket.IO server: 2.5–5s and filter jitter
      if (elapsed >= throttleIntervalMs && hasMovedSignificantly) {
        lastEmitTimeRef.current = now;
        lastEmittedLocationRef.current = loc;

        if (pickupId) {
          emitVolunteerLocation({
            pickupId,
            latitude: loc.latitude,
            longitude: loc.longitude,
            accuracy: loc.accuracy,
            speed: loc.speed ?? 0,
            heading: loc.heading ?? 0,
            timestamp: loc.timestamp
          });
        }

        if (onLocationUpdate) {
          onLocationUpdate(loc);
        }
      }
    },
    [pickupId, throttleIntervalMs, minMovementMeters, onLocationUpdate]
  );

  const handlePositionError = useCallback(
    (error: GeolocationPositionError) => {
      let message = 'An unknown GPS error occurred.';
      switch (error.code) {
        case error.PERMISSION_DENIED:
          message = 'Location permission was denied. Please allow location access in your browser settings to transmit delivery navigation.';
          setPermissionStatus('denied');
          break;
        case error.POSITION_UNAVAILABLE:
          message = 'GPS signal is currently unavailable. Please ensure device location / GPS is turned on.';
          break;
        case error.TIMEOUT:
          message = 'GPS location request timed out. Retrying GPS lock...';
          break;
      }
      setGpsError(message);
      if (onError) onError(message);
    },
    [onError]
  );

  const startWatching = useCallback(() => {
    if (!('geolocation' in navigator)) {
      const msg = 'Geolocation is not supported by your browser.';
      setPermissionStatus('unsupported');
      setGpsError(msg);
      if (onError) onError(msg);
      return;
    }

    stopWatching();

    try {
      const id = navigator.geolocation.watchPosition(
        handlePositionSuccess,
        handlePositionError,
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        }
      );
      watchIdRef.current = id;
      setIsWatching(true);
      setGpsError(null);
    } catch (e: any) {
      setGpsError('Failed to start GPS watcher: ' + e.message);
    }
  }, [handlePositionSuccess, handlePositionError, stopWatching, onError]);

  useEffect(() => {
    if (enabled) {
      startWatching();
    } else {
      stopWatching();
    }

    return () => {
      stopWatching();
    };
  }, [enabled, startWatching, stopWatching]);

  return {
    currentLocation,
    isWatching,
    permissionStatus,
    gpsError,
    startWatching,
    stopWatching
  };
};
