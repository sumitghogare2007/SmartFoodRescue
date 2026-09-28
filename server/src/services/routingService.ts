import axios from 'axios';

export interface RouteCoordinates {
  latitude: number;
  longitude: number;
}

export interface RouteResult {
  provider: 'google' | 'osrm';
  distanceMeters: number;
  distanceKm: number;
  durationSeconds: number;
  durationMinutes: number;
  coordinates: [number, number][]; // [latitude, longitude][]
  encodedPolyline?: string;
  destination: {
    latitude: number;
    longitude: number;
  };
}

// Simple Polyline decoder for Google Routes encoded polylines
function decodeGooglePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    points.push([lat / 1e5, lng / 1e5]);
  }

  return points;
}

// Haversine formula distance (meters)
export function haversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

class RoutingService {
  // In-memory cache for recent route calculations: key -> { timestamp, result, originLat, originLng }
  private cache: Map<string, { timestamp: number; result: RouteResult; origin: RouteCoordinates }> = new Map();
  private readonly CACHE_TTL_MS = 60 * 1000; // 60 seconds cache
  private readonly MOVEMENT_THRESHOLD_METERS = 150; // Cache invalidation if moved > 150m

  /**
   * Compute driving route between origin and destination.
   * Default: OSRM. Google is opt-in via ROUTING_PROVIDER=google.
   */
  public async computeRoute(
    origin: RouteCoordinates,
    destination: RouteCoordinates,
    forceRecalculate = false
  ): Promise<RouteResult> {
    if (process.env.TRACKING_DEBUG === 'true') console.info('[Routing] Route requested');
    const cacheKey = `${origin.latitude.toFixed(4)},${origin.longitude.toFixed(4)}->${destination.latitude.toFixed(4)},${destination.longitude.toFixed(4)}`;
    const now = Date.now();

    if (!forceRecalculate) {
      const cached = this.cache.get(cacheKey);
      if (cached && now - cached.timestamp < this.CACHE_TTL_MS) {
        const distFromCachedOrigin = haversineDistanceMeters(
          origin.latitude,
          origin.longitude,
          cached.origin.latitude,
          cached.origin.longitude
        );
        if (distFromCachedOrigin < this.MOVEMENT_THRESHOLD_METERS) {
          return cached.result;
        }
      }
    }

    const apiKey = process.env.ROUTING_PROVIDER === 'google' ? process.env.GOOGLE_MAPS_API_KEY : undefined;

    // 1. Primary: Google Routes API (Directions v2)
    if (apiKey) {
      try {
        const googleRes = await axios.post(
          'https://routes.googleapis.com/directions/v2:computeRoutes',
          {
            origin: {
              location: {
                latLng: {
                  latitude: origin.latitude,
                  longitude: origin.longitude
                }
              }
            },
            destination: {
              location: {
                latLng: {
                  latitude: destination.latitude,
                  longitude: destination.longitude
                }
              }
            },
            travelMode: 'DRIVE',
            routingPreference: 'TRAFFIC_AWARE'
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': apiKey,
              'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline'
            },
            timeout: 6000
          }
        );

        const route = googleRes.data?.routes?.[0];
        if (route) {
          const distanceMeters = Number(route.distanceMeters) || 0;
          // Duration format from Google Routes API: e.g. "450s"
          const durationSeconds = parseInt(String(route.duration || '0').replace('s', ''), 10) || 0;
          const encodedPolyline = route.polyline?.encodedPolyline || '';
          if (!encodedPolyline) throw new Error('Route geometry missing');
          const coordinates = decodeGooglePolyline(encodedPolyline);

          const result: RouteResult = {
            provider: 'google',
            distanceMeters,
            distanceKm: Number((distanceMeters / 1000).toFixed(2)),
            durationSeconds,
            durationMinutes: Math.max(1, Math.round(durationSeconds / 60)),
            coordinates,
            encodedPolyline,
            destination
          };

          this.cache.set(cacheKey, { timestamp: now, result, origin });
          return result;
        }
      } catch (googleError: any) {
        console.warn(
          '[RoutingService] Google Routes API request failed, falling back to OSRM:',
          googleError?.response?.status || 'request failed'
        );
      }
    }

    // Default road provider; also the fallback for explicitly configured Google routing.
    try {
      const osrmUrl = `${(process.env.OSRM_URL || 'https://router.project-osrm.org').replace(/\/$/, '')}/route/v1/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson`;
      const osrmRes = await axios.get(osrmUrl, { timeout: 5000 });
      const osrmRoute = osrmRes.data?.routes?.[0];

      if (osrmRes.data?.code === 'Ok' && osrmRoute?.geometry?.coordinates?.length >= 2 &&
          Number.isFinite(osrmRoute.distance) && Number.isFinite(osrmRoute.duration)) {
        const distanceMeters = Math.round(osrmRoute.distance || 0);
        const durationSeconds = Math.round(osrmRoute.duration || 0);
        // OSRM coordinates are [lon, lat], convert to [lat, lon]
        const rawCoords: [number, number][] = osrmRoute.geometry?.coordinates || [];
        if (!rawCoords.every(([lon, lat]) => Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180)) throw new Error('Invalid route geometry');
        const coordinates: [number, number][] = rawCoords.map(([lon, lat]) => [lat, lon]);

        const result: RouteResult = {
          provider: 'osrm',
          distanceMeters,
          distanceKm: Number((distanceMeters / 1000).toFixed(2)),
          durationSeconds,
          durationMinutes: Math.max(1, Math.round(durationSeconds / 60)),
          coordinates,
          destination
        };

        if (process.env.TRACKING_DEBUG === 'true') console.info('[Routing] OSRM response received', { distanceMeters, durationSeconds });
        this.cache.set(cacheKey, { timestamp: now, result, origin });
        return result;
      }
    } catch (osrmError: any) {
      console.warn(
        '[RoutingService] OSRM routing failed:',
        osrmError?.message
      );
    }

    throw Object.assign(new Error('Road routing service is unavailable. Please retry.'), { statusCode: 503 });
  }

  /**
   * Check if the user has moved significantly off-route or beyond threshold.
   */
  public isMeaningfulMovement(
    lastLocation: RouteCoordinates,
    currentLocation: RouteCoordinates,
    thresholdMeters = 200
  ): boolean {
    const dist = haversineDistanceMeters(
      lastLocation.latitude,
      lastLocation.longitude,
      currentLocation.latitude,
      currentLocation.longitude
    );
    return dist >= thresholdMeters;
  }
}

export const routingService = new RoutingService();
