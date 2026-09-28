export function validateLocation(payload: any): string | null {
  if (!payload || !Number.isFinite(payload.latitude) || Math.abs(payload.latitude) > 90 ||
      !Number.isFinite(payload.longitude) || Math.abs(payload.longitude) > 180) {
    return 'Invalid GPS coordinates. Latitude [-90, 90], longitude [-180, 180].';
  }
  for (const key of ['accuracy', 'speed', 'heading']) {
    const value = payload[key];
    if (value != null && (!Number.isFinite(value) || value < 0 || (key === 'heading' && value > 360))) {
      return `Invalid GPS ${key}.`;
    }
  }
  if (payload.timestamp != null) {
    const time = new Date(payload.timestamp).getTime();
    if (!Number.isFinite(time) || time > Date.now() + 30000 || time < Date.now() - 120000) {
      return 'GPS timestamp is invalid or stale. Request a fresh device location.';
    }
  }
  return null;
}
