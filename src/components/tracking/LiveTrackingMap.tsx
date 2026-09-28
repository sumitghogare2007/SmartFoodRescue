import { useEffect, useMemo, useState } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import type { RouteData } from '../../services/routingClient';
import { hasCoordinates } from '../../lib/coordinates';
export interface LocationPoint { latitude: number; longitude: number; name?: string; address?: string }
export interface LiveTrackingMapProps {
  volunteerLocation?: (LocationPoint & { heading?: number | null; accuracy?: number; speed?: number | null }) | null;
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
const icon = (symbol: string, color: string, heading = 0) => L.divIcon({
  className: '', iconSize: [42, 42], iconAnchor: [21, 21],
  html: `<div style="width:42px;height:42px;border:3px solid white;border-radius:50%;background:${color};display:grid;place-items:center;font-size:24px;box-shadow:0 2px 8px #555;transform:rotate(${Number.isFinite(heading) ? heading : 0}deg)">${symbol}</div>`
});
const donorIcon = icon('📍', '#047857');
const ngoIcon = icon('🏢', '#7e22ce');
const point = (p: LocationPoint): [number, number] => [p.latitude, p.longitude];
function MapView({ points, volunteer, follow }: { points: LocationPoint[]; volunteer?: LocationPoint | null; follow: boolean }) {
  const map = useMap();
  const [fitted, setFitted] = useState(false);
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());
    map.invalidateSize();
    return () => observer.disconnect();
  }, [map]);
  useEffect(() => {
    if (!fitted && points.length) {
      map.fitBounds(L.latLngBounds(points.map(point)), { padding: [45, 45], maxZoom: 15 });
      setFitted(true);
    }
  }, [points, fitted, map]);
  useEffect(() => { if (follow && volunteer) map.panTo(point(volunteer)); }, [volunteer?.latitude, volunteer?.longitude, follow, map]);
  return null;
}
export function LiveTrackingMap({ volunteerLocation, pickupLocation, destinationLocation, route,
  distanceKm = route?.distanceKm, durationMinutes = route?.durationMinutes, lastUpdatedText,
  connectionStatus = 'WAITING', isStale = false, className = 'h-96 w-full rounded-xl', autoCenter = true }: LiveTrackingMapProps) {
  const [follow, setFollow] = useState(autoCenter);
  const [tileError, setTileError] = useState(false);
  const volunteer = hasCoordinates(volunteerLocation) ? volunteerLocation : null;
  const donor = hasCoordinates(pickupLocation) ? pickupLocation : null;
  const ngo = hasCoordinates(destinationLocation) ? destinationLocation : null;
  const points = [donor, ngo, volunteer].filter((p): p is NonNullable<typeof p> => p !== null);
  const vehicleIcon = useMemo(() => icon('🚚', '#d97706', volunteer?.heading ?? 0), [volunteer?.heading]);
  const status = connectionStatus === 'COMPLETED' ? 'Tracking ended' : connectionStatus === 'DISCONNECTED' ? 'Connection lost' :
    connectionStatus === 'RECONNECTING' ? 'Reconnecting...' : !volunteer || connectionStatus === 'WAITING' ? 'Waiting for volunteer GPS...' : isStale ? 'Location stale' : 'Live tracking';
  return <div>
    <div className="flex flex-wrap justify-between gap-2 py-2 text-sm">
      <span role="status">{status}</span>
      <label className="p-2"><input type="checkbox" checked={follow} onChange={e => setFollow(e.target.checked)} /> Follow Volunteer</label>
    </div>
    {!donor && <p className="text-amber-800 text-sm">Pickup coordinates unavailable.</p>}
    {!ngo && <p className="text-amber-800 text-sm">NGO destination location is unavailable.</p>}
    {tileError && <p role="alert" className="text-red-700">Map tiles could not load. Check your connection or retry when the OpenStreetMap tile service is available.</p>}
    <div className={`overflow-hidden relative ${className}`} style={{ minHeight: 320 }}>
      <MapContainer center={points.length ? point(points[0]) : [0, 0]} zoom={points.length ? 14 : 2} style={{ height: '100%', width: '100%', minHeight: 320, zIndex: 0 }}>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" eventHandlers={{ tileerror: () => setTileError(true), tileload: () => setTileError(false) }} />
        <MapView points={points} volunteer={volunteer} follow={follow} />
        {donor && <Marker position={point(donor)} icon={donorIcon}><Popup>Donor: {donor.name || donor.address}</Popup></Marker>}
        {ngo && <Marker position={point(ngo)} icon={ngoIcon}><Popup>NGO: {ngo.name || ngo.address}</Popup></Marker>}
        {volunteer && <Marker position={point(volunteer)} icon={vehicleIcon}><Popup>Volunteer GPS{volunteer.speed != null ? ` • ${volunteer.speed} km/h` : ''}</Popup></Marker>}
        {route && <Polyline positions={route.coordinates} pathOptions={{ color: '#2563eb', weight: 5 }} />}
      </MapContainer>
    </div>
    <div className="flex flex-wrap gap-4 py-2 text-sm"><span>📍 Donor</span><span>🏢 NGO</span><span>🚚 Volunteer</span>
      <span>{distanceKm != null ? `${distanceKm} km` : 'Distance unavailable'}</span>
      <span>{durationMinutes != null ? `${durationMinutes} min ETA` : 'ETA unavailable'}</span><span>{lastUpdatedText}</span>
    </div>
  </div>;
}
