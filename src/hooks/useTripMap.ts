import { useEffect, useRef, useState } from "react";
import type { LeafletMapHandle } from "@/hooks/useLeafletMap";
import { haversineKm } from "@/lib/distance";
import { geoService } from "@/services/geo.service";
import type { Coords } from "@/types/common";

const ROUTE_REFRESH_MS = 10_000;

function emojiIcon(
  leaflet: NonNullable<LeafletMapHandle["L"]["current"]>,
  emoji: string,
  anchorY: number,
) {
  return leaflet.divIcon({
    html: `<div style="font-size:20px;line-height:1">${emoji}</div>`,
    className: "map-emoji-icon",
    iconSize: [24, 24],
    iconAnchor: [12, anchorY],
  });
}

/**
 * Keeps the driver (🏍️) and customer (📍) markers in sync with their coordinates and
 * frames both — only when one of them is outside the visible area, so the user can pan
 * and zoom without the map snapping back on every GPS update. With only the customer
 * known, optionally centers on them.
 */
export function useTripMarkers(
  { isReady, L, mapRef, driverMarkerRef, customerMarkerRef }: LeafletMapHandle,
  driverCoords: Coords | null,
  customerCoords: Coords | null,
  { centerOnCustomer = false }: { centerOnCustomer?: boolean } = {},
) {
  useEffect(() => {
    const leaflet = L.current;
    const map = mapRef.current;
    if (!isReady || !leaflet || !map) return;

    const place = (ref: typeof driverMarkerRef, coords: Coords, emoji: string, anchorY: number) => {
      if (ref.current) ref.current.setLatLng([coords.lat, coords.lng]);
      else
        ref.current = leaflet
          .marker([coords.lat, coords.lng], { icon: emojiIcon(leaflet, emoji, anchorY) })
          .addTo(map);
    };
    if (driverCoords) place(driverMarkerRef, driverCoords, "🏍️", 12);
    if (customerCoords) place(customerMarkerRef, customerCoords, "📍", 24);

    const inView = (c: Coords) => map.getBounds().contains([c.lat, c.lng]);
    if (driverCoords && customerCoords) {
      if (inView(driverCoords) && inView(customerCoords)) return;
      map.fitBounds(
        leaflet.latLngBounds([
          [driverCoords.lat, driverCoords.lng],
          [customerCoords.lat, customerCoords.lng],
        ]),
        { padding: [24, 24] },
      );
    } else if (customerCoords && centerOnCustomer) {
      map.setView([customerCoords.lat, customerCoords.lng], 15);
    }
    // Refs are stable; coordinates are compared by value to avoid redraws on new objects
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, driverCoords?.lat, driverCoords?.lng, customerCoords?.lat, customerCoords?.lng]);
}

export interface DrivingRouteInfo {
  distanceKm: number;
  durationMin: number;
  /** Straight-line estimate, used when the routing service fails or finds no route. */
  isEstimate: boolean;
  updatedAt: number;
}

interface DrivingRouteOptions {
  /** Average speed used for the straight-line estimate. */
  fallbackKmh: number;
  /** Re-frame the map around the route line on every refresh. */
  fitToRoute?: boolean;
}

/**
 * Polls the driving route between driver and customer every 10s, draws it as a
 * polyline and returns its distance/duration (or a straight-line estimate).
 *
 * The poll reads the latest coordinates from refs instead of restarting on each change:
 * GPS updates arrive every few seconds, and restarting would request a route each time.
 */
export function useDrivingRoute(
  { isReady, L, mapRef, routeLineRef }: LeafletMapHandle,
  driverCoords: Coords | null,
  customerCoords: Coords | null,
  { fallbackKmh, fitToRoute = false }: DrivingRouteOptions,
) {
  const [route, setRoute] = useState<DrivingRouteInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const driverRef = useRef(driverCoords);
  driverRef.current = driverCoords;
  const hasDriver = !!driverCoords;

  useEffect(() => {
    if (!isReady || !hasDriver || !customerCoords) return;
    let cancelled = false;
    let framed = false;

    const refresh = async () => {
      const from = driverRef.current;
      if (!from) return;
      setLoading(true);
      try {
        const result = await geoService.drivingRoute(from, customerCoords);
        if (cancelled) return;
        if (!result) throw new Error("no-route");
        const leaflet = L.current;
        const map = mapRef.current;
        if (leaflet && map) {
          if (routeLineRef.current) routeLineRef.current.setLatLngs(result.path);
          else
            routeLineRef.current = leaflet
              .polyline(result.path, { color: "#2563eb", weight: 5 })
              .addTo(map);
          // Frame the route once; afterwards the user controls the view
          if (fitToRoute && !framed) {
            map.fitBounds(routeLineRef.current.getBounds(), { padding: [24, 24] });
            framed = true;
          }
        }
        setRoute({
          distanceKm: result.distanceKm,
          durationMin: result.durationMin,
          isEstimate: false,
          updatedAt: Date.now(),
        });
      } catch {
        if (cancelled) return;
        const km = haversineKm(from, customerCoords);
        setRoute({
          distanceKm: km,
          durationMin: Math.max(1, (km / fallbackKmh) * 60),
          isEstimate: true,
          updatedAt: Date.now(),
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void refresh();
    const intervalId = window.setInterval(refresh, ROUTE_REFRESH_MS);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
    // Refs are stable; the driver position is read from `driverRef` on each poll, and the
    // customer's is compared by value (it only changes with a different order)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, hasDriver, customerCoords?.lat, customerCoords?.lng]);

  return { route, loading };
}
