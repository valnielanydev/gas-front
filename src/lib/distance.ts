/**
 * Geo helpers for distance + simple ETA calculations.
 * Free, frontend-only — no external API calls.
 */

const EARTH_RADIUS_KM = 6371;

/** Haversine distance in km between two lat/lng points. */
export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Estimate delivery time (in minutes) from a straight-line distance.
 * Uses an average urban motorbike speed and adds a fixed prep buffer.
 * Tweak constants if real telemetry is added later.
 */
export function estimateEtaMinutes(
  distanceKm: number,
  opts: { avgKmh?: number; prepMinutes?: number } = {},
): number {
  const avgKmh = opts.avgKmh ?? 30;
  const prep = opts.prepMinutes ?? 5;
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) return prep;
  const travel = (distanceKm / avgKmh) * 60;
  return Math.max(1, Math.round(prep + travel));
}

export function formatKm(km: number): string {
  if (!Number.isFinite(km)) return "—";
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export function formatEta(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return "—";
  if (minutes < 60) return `~${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `~${h}h ${m}min` : `~${h}h`;
}
