export function hasCoordinates(value: unknown): value is { latitude: number; longitude: number } {
  const point = value as { latitude?: number; longitude?: number } | null;
  return !!point && typeof point.latitude === 'number' && Number.isFinite(point.latitude)
    && Math.abs(point.latitude) <= 90 && typeof point.longitude === 'number'
    && Number.isFinite(point.longitude) && Math.abs(point.longitude) <= 180;
}
