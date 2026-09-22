import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { RouteData } from '../../services/routingClient';

export interface LocationPoint {
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
}

export interface LiveTrackingMapProps {
  volunteerLocation?: {
    latitude: number;
    longitude: number;
    heading?: number | null;
    accuracy?: number;
    speed?: number | null;
  } | null;
  pickupLocation?: LocationPoint | null;
  destinationLocation?: LocationPoint | null;
  route?: RouteData | null;
  distanceKm?: number;
  durationMinutes?: number;
  lastUpdatedText?: string;
  connectionStatus?: string;
  isStale?: boolean;
  className?: string;
  autoCenter?: boolean;
}

// Custom Leaflet Icons
const createDonorIcon = () =>
  L.divIcon({
    className: 'custom-donor-pin',
    html: `
      <div class="relative flex items-center justify-center">
        <div class="w-9 h-9 bg-emerald-700 text-white rounded-full shadow-lg border-2 border-white flex items-center justify-center font-bold text-base">
          📍
        </div>
        <div class="absolute -bottom-1 w-2 h-2 bg-emerald-700 rotate-45"></div>
      </div>
    `,
    iconSize: [36, 42],
    iconAnchor: [18, 42],
    popupAnchor: [0, -42]
  });

const createNgoIcon = () =>
  L.divIcon({
    className: 'custom-ngo-pin',
    html: `
      <div class="relative flex items-center justify-center">
        <div class="w-9 h-9 bg-purple-700 text-white rounded-full shadow-lg border-2 border-white flex items-center justify-center font-bold text-base">
          🎯
        </div>
        <div class="absolute -bottom-1 w-2 h-2 bg-purple-700 rotate-45"></div>
      </div>
    `,
    iconSize: [36, 42],
    iconAnchor: [18, 42],
    popupAnchor: [0, -42]
  });

const createVolunteerIcon = (heading: number | null = null) => {
  const rotation = heading !== null && !isNaN(heading) ? heading : 0;
  return L.divIcon({
    className: 'custom-volunteer-marker',
    html: `
      <div class="relative flex items-center justify-center transition-transform duration-300" style="transform: rotate(${rotation}deg)">
        <div class="w-11 h-11 bg-amber-500 rounded-full shadow-xl border-3 border-white flex items-center justify-center text-xl">
          🚚
        </div>
        <div class="absolute -top-1 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full animate-ping"></div>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22]
  });
};

export const LiveTrackingMap: React.FC<LiveTrackingMapProps> = ({
  volunteerLocation,
  pickupLocation,
  destinationLocation,
  route,
  distanceKm = route?.distanceKm,
  durationMinutes = route?.durationMinutes,
  lastUpdatedText,
  connectionStatus = 'LIVE',
  isStale = false,
  className = 'h-96 w-full rounded-xl overflow-hidden',
  autoCenter = true
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const volunteerMarkerRef = useRef<L.Marker | null>(null);
  const pickupMarkerRef = useRef<L.Marker | null>(null);
  const destinationMarkerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);

  const [mapInitialized, setMapInitialized] = useState(false);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Default center: India / Mumbai coordinates
    const defaultCenter: [number, number] = [
      volunteerLocation?.latitude || pickupLocation?.latitude || destinationLocation?.latitude || 19.076,
      volunteerLocation?.longitude || pickupLocation?.longitude || destinationLocation?.longitude || 72.8777
    ];

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 14,
      zoomControl: false
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // OpenStreetMap high-contrast clean tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    mapInstanceRef.current = map;
    setMapInitialized(true);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Pickup & Destination Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapInitialized) return;

    // Pickup Marker
    if (pickupLocation && typeof pickupLocation.latitude === 'number' && typeof pickupLocation.longitude === 'number') {
      const latLng: [number, number] = [pickupLocation.latitude, pickupLocation.longitude];
      if (!pickupMarkerRef.current) {
        pickupMarkerRef.current = L.marker(latLng, { icon: createDonorIcon() })
          .addTo(map)
          .bindPopup(`<b>Pickup Location (Donor)</b><br/>${pickupLocation.name || pickupLocation.address || ''}`);
      } else {
        pickupMarkerRef.current.setLatLng(latLng);
      }
    }

    // Destination Marker
    if (destinationLocation && typeof destinationLocation.latitude === 'number' && typeof destinationLocation.longitude === 'number') {
      const latLng: [number, number] = [destinationLocation.latitude, destinationLocation.longitude];
      if (!destinationMarkerRef.current) {
        destinationMarkerRef.current = L.marker(latLng, { icon: createNgoIcon() })
          .addTo(map)
          .bindPopup(`<b>Delivery Destination (NGO)</b><br/>${destinationLocation.name || destinationLocation.address || ''}`);
      } else {
        destinationMarkerRef.current.setLatLng(latLng);
      }
    }
  }, [pickupLocation, destinationLocation, mapInitialized]);

  // Update Volunteer Marker (REAL GPS Coordinates received via Socket.IO - No page refresh)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapInitialized || !volunteerLocation) return;

    const { latitude, longitude, heading, speed } = volunteerLocation;
    if (typeof latitude !== 'number' || typeof longitude !== 'number') return;

    const latLng: [number, number] = [latitude, longitude];

    if (!volunteerMarkerRef.current) {
      volunteerMarkerRef.current = L.marker(latLng, {
        icon: createVolunteerIcon(heading),
        zIndexOffset: 1000
      })
        .addTo(map)
        .bindPopup(`
          <div class="text-xs">
            <p class="font-bold text-emerald-800">🚚 Volunteer Location</p>
            <p>Speed: ${speed ? `${speed} km/h` : 'Stationary'}</p>
            <p>GPS Lock: Real Device</p>
          </div>
        `);
    } else {
      volunteerMarkerRef.current.setLatLng(latLng);
      volunteerMarkerRef.current.setIcon(createVolunteerIcon(heading));
    }

    if (autoCenter) {
      map.panTo(latLng, { animate: true, duration: 0.8 });
    }
  }, [volunteerLocation, autoCenter, mapInitialized]);

  // Update Route Polyline
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapInitialized) return;

    if (route && route.coordinates && route.coordinates.length > 0) {
      if (routePolylineRef.current) {
        routePolylineRef.current.remove();
      }

      // Render vibrant navigation path
      routePolylineRef.current = L.polyline(route.coordinates, {
        color: '#2563eb',
        weight: 5,
        opacity: 0.85,
        lineJoin: 'round',
        dashArray: undefined
      }).addTo(map);

      // Fit map to show both volunteer and destination if autoCenter is disabled or on initial route load
      if (!autoCenter) {
        const bounds = routePolylineRef.current.getBounds();
        map.fitBounds(bounds, { padding: [40, 40] });
      }
    }
  }, [route, autoCenter, mapInitialized]);

  const handleCenterOnVolunteer = () => {
    if (mapInstanceRef.current && volunteerLocation) {
      mapInstanceRef.current.setView([volunteerLocation.latitude, volunteerLocation.longitude], 16, {
        animate: true
      });
    }
  };

  const handleFitAllBounds = () => {
    if (!mapInstanceRef.current) return;
    const points: [number, number][] = [];
    if (volunteerLocation) points.push([volunteerLocation.latitude, volunteerLocation.longitude]);
    if (pickupLocation) points.push([pickupLocation.latitude, pickupLocation.longitude]);
    if (destinationLocation) points.push([destinationLocation.latitude, destinationLocation.longitude]);

    if (points.length > 1) {
      const bounds = L.latLngBounds(points);
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
    } else if (points.length === 1) {
      mapInstanceRef.current.setView(points[0], 15);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating On-Map HUD (Requirement 5: Status, Distance, ETA, Last Updated) */}
      <div className="absolute top-3 left-3 z-400 flex flex-col gap-2 max-w-[280px]">
        {/* Connection / Status Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold shadow-md backdrop-blur-md bg-white/95 border border-gray-200">
          {connectionStatus === 'LIVE' && !isStale && (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-emerald-800 font-extrabold tracking-wide">LIVE TRACKING</span>
            </>
          )}
          {connectionStatus === 'RECONNECTING' && (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
              <span className="text-amber-800 font-extrabold tracking-wide">RECONNECTING...</span>
            </>
          )}
          {isStale && connectionStatus !== 'COMPLETED' && (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span className="text-amber-800 font-extrabold tracking-wide">LOCATION STALE</span>
            </>
          )}
          {connectionStatus === 'COMPLETED' && (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              <span className="text-blue-800 font-extrabold tracking-wide">DELIVERY ARRIVED</span>
            </>
          )}
          {(!connectionStatus || (connectionStatus !== 'LIVE' && connectionStatus !== 'RECONNECTING' && connectionStatus !== 'COMPLETED' && !isStale)) && (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="text-emerald-800 font-extrabold tracking-wide">{connectionStatus}</span>
            </>
          )}
        </div>

        {/* Distance & ETA Floating Card */}
        {(distanceKm !== undefined || durationMinutes !== undefined || lastUpdatedText) && (
          <div className="bg-white/95 backdrop-blur-md px-3 py-2 rounded-lg shadow-md border border-gray-200 text-xs space-y-1">
            <div className="flex items-center justify-between gap-3 text-gray-900 font-bold">
              <span>{distanceKm !== undefined ? `${distanceKm} km` : '-- km'}</span>
              <span className="text-gray-300">•</span>
              <span className="text-[#166534]">{durationMinutes !== undefined ? `${durationMinutes} min ETA` : '-- min ETA'}</span>
            </div>
            {lastUpdatedText && (
              <div className="text-[10px] text-gray-500 pt-1 border-t border-gray-100 flex items-center justify-between">
                <span>Updated:</span>
                <span className="font-medium text-gray-700">{lastUpdatedText}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Map Controls */}
      <div className="absolute top-3 right-3 z-400 flex flex-col gap-2">
        {volunteerLocation && (
          <button
            type="button"
            onClick={handleCenterOnVolunteer}
            title="Center on Volunteer"
            className="p-2.5 bg-white/95 backdrop-blur-sm text-gray-800 rounded-lg shadow-md border border-gray-200 hover:bg-emerald-50 hover:text-emerald-700 transition flex items-center justify-center font-bold text-xs"
          >
            🚚
          </button>
        )}
        <button
          type="button"
          onClick={handleFitAllBounds}
          title="Fit entire route on screen"
          className="p-2.5 bg-white/95 backdrop-blur-sm text-gray-800 rounded-lg shadow-md border border-gray-200 hover:bg-blue-50 hover:text-blue-700 transition flex items-center justify-center font-bold text-xs"
        >
          🔍
        </button>
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-3 left-3 z-400 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-md shadow-md border border-gray-200 text-[11px] flex items-center gap-3">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
          <span className="text-gray-700 font-medium">Donor</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          <span className="text-gray-700 font-medium">Volunteer</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-purple-600"></span>
          <span className="text-gray-700 font-medium">Destination</span>
        </span>
      </div>
    </div>
  );
};
