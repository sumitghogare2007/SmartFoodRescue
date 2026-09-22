import { apiClient } from '../lib/api';

export interface RouteData {
  provider: 'google' | 'osrm' | 'fallback';
  distanceMeters: number;
  distanceKm: number;
  durationSeconds: number;
  durationMinutes: number;
  coordinates: [number, number][]; // [lat, lng]
  encodedPolyline?: string;
  destination: {
    latitude: number;
    longitude: number;
  };
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

// Distance helper
export function calculateHaversineDistance(
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

class RoutingClientService {
  private routeCache: Map<string, { route: RouteData; timestamp: number; origin: Coordinates }> = new Map();
  private readonly MIN_RECALCULATE_INTERVAL_MS = 25000; // 25s minimum between routing calls
  private readonly MEANINGFUL_MOVEMENT_METERS = 200; // 200m movement required for automatic recalculation

  /**
   * Request route calculation from the decoupled backend routing service.
   * Will only trigger an API call if no valid cache exists, or force is true, or meaningful movement occurred.
   */
  public async getRoute(
    pickupId: string,
    currentLocation?: Coordinates | null,
    force = false
  ): Promise<RouteData | null> {
    const cached = this.routeCache.get(pickupId);
    const now = Date.now();

    if (!force && cached && currentLocation) {
      const elapsed = now - cached.timestamp;
      const movedDist = calculateHaversineDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        cached.origin.latitude,
        cached.origin.longitude
      );

      // Avoid API call if within minimum interval or haven't moved meaningfully
      if (elapsed < this.MIN_RECALCULATE_INTERVAL_MS || movedDist < this.MEANINGFUL_MOVEMENT_METERS) {
        return cached.route;
      }
    }

    try {
      const params: any = {};
      if (currentLocation) {
        params.lat = currentLocation.latitude;
        params.lng = currentLocation.longitude;
      }
      if (force) {
        params.force = true;
      }

      const res = await apiClient.get(`/api/pickups/${pickupId}/route`, { params });
      const route: RouteData = res.data;

      if (currentLocation) {
        this.routeCache.set(pickupId, {
          route,
          timestamp: now,
          origin: currentLocation
        });
      }

      return route;
    } catch (err: any) {
      console.warn('[RoutingClient] Failed to fetch route:', err?.message || err);
      return cached ? cached.route : null;
    }
  }

  /**
   * Determine whether a location update should trigger route recalculation.
   */
  public shouldRecalculate(
    pickupId: string,
    currentLocation: Coordinates
  ): boolean {
    const cached = this.routeCache.get(pickupId);
    if (!cached) return true;

    const elapsed = Date.now() - cached.timestamp;
    if (elapsed < this.MIN_RECALCULATE_INTERVAL_MS) return false;

    const moved = calculateHaversineDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      cached.origin.latitude,
      cached.origin.longitude
    );

    return moved >= this.MEANINGFUL_MOVEMENT_METERS;
  }

  public clearCache(pickupId?: string) {
    if (pickupId) {
      this.routeCache.delete(pickupId);
    } else {
      this.routeCache.clear();
    }
  }
}

export const routingClient = new RoutingClientService();
