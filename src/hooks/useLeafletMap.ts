import { useEffect, useRef, useState } from "react";
import type { Map as LMap, Marker as LMarker, Polyline as LPolyline } from "leaflet";
import type * as LeafletNS from "leaflet";

interface UseLeafletMapOptions {
  enabled: boolean;
  initialCenter?: [number, number];
  zoom?: number;
}

export interface LeafletMapHandle {
  mapEl: React.RefObject<HTMLDivElement | null>;
  mapRef: React.RefObject<LMap | null>;
  L: React.RefObject<typeof LeafletNS | null>;
  driverMarkerRef: React.RefObject<LMarker | null>;
  customerMarkerRef: React.RefObject<LMarker | null>;
  routeLineRef: React.RefObject<LPolyline | null>;
  isReady: boolean;
}

export function useLeafletMap({
  enabled,
  initialCenter,
  zoom = 14,
}: UseLeafletMapOptions): LeafletMapHandle {
  const mapEl = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LMap | null>(null);
  const L = useRef<typeof LeafletNS | null>(null);
  const driverMarkerRef = useRef<LMarker | null>(null);
  const customerMarkerRef = useRef<LMarker | null>(null);
  const routeLineRef = useRef<LPolyline | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    (async () => {
      if (!mapEl.current) return;
      const leaflet = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      if (cancelled || !mapEl.current) return;
      L.current = leaflet;
      if (!mapRef.current) {
        const center: [number, number] = initialCenter ?? [-23.55, -46.63];
        mapRef.current = leaflet.map(mapEl.current, { zoomControl: false }).setView(center, zoom);
        leaflet
          .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          })
          .addTo(mapRef.current);
        leaflet.control.zoom({ position: "bottomright" }).addTo(mapRef.current);
        window.setTimeout(() => mapRef.current?.invalidateSize(), 150);
      }
      if (!cancelled) setIsReady(true);
    })();
    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        driverMarkerRef.current = null;
        customerMarkerRef.current = null;
        routeLineRef.current = null;
        L.current = null;
        setIsReady(false);
      }
    };
  }, [enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  return { mapEl, mapRef, L, driverMarkerRef, customerMarkerRef, routeLineRef, isReady };
}
