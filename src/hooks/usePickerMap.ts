import { useEffect, useRef, useState, type RefObject } from "react";
import type { LeafletMouseEvent, Map as LMap, Marker as LMarker } from "leaflet";

export const DEFAULT_MAP_CENTER: [number, number] = [-12.9777, -38.5016];

interface Options {
  enabled: boolean;
  /** Initial view; read once when the map is created. */
  center: [number, number];
  zoom: number;
  markerSize: number;
  /** Called when the user drags the marker or clicks the map. */
  onPick: (lat: number, lng: number) => void;
}

/**
 * Leaflet map with a single draggable marker, created inside `el` while `enabled`
 * and removed when disabled or unmounted.
 */
export function usePickerMap(
  el: RefObject<HTMLDivElement | null>,
  { enabled, center, zoom, markerSize, onPick }: Options,
) {
  const mapRef = useRef<LMap | null>(null);
  const markerRef = useRef<LMarker | null>(null);
  const [ready, setReady] = useState(false);
  // Leaflet listeners are registered once; the ref always points at the latest callback
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let map: LMap | null = null;
    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      if (cancelled || !el.current) return;

      map = L.map(el.current).setView(center, zoom);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);

      const half = markerSize / 2;
      const icon = L.divIcon({
        className: "",
        html: `<div style="width:${markerSize}px;height:${markerSize}px;border-radius:9999px;background:var(--primary);border:4px solid white;box-shadow:0 2px 10px rgba(0,0,0,.3)"></div>`,
        iconSize: [markerSize, markerSize],
        iconAnchor: [half, half],
      });
      const marker = L.marker(center, { icon, draggable: true }).addTo(map);
      marker.on("dragend", () => {
        const ll = marker.getLatLng();
        onPickRef.current(ll.lat, ll.lng);
      });
      map.on("click", (e: LeafletMouseEvent) => {
        marker.setLatLng(e.latlng);
        onPickRef.current(e.latlng.lat, e.latlng.lng);
      });

      mapRef.current = map;
      markerRef.current = marker;
      setReady(true);
    })();
    return () => {
      cancelled = true;
      map?.remove();
      mapRef.current = null;
      markerRef.current = null;
      setReady(false);
    };
    // center/zoom only set the initial view
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return { mapRef, markerRef, ready };
}
