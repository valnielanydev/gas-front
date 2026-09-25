import { useEffect, useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useLeafletMap } from "@/hooks/useLeafletMap";
import type { Coords } from "@/types/common";
import type { FullOrder } from "@/types/order";
import { haversineKm, formatEta } from "@/lib/distance";
import { SPEED_KMH } from "@/lib/constants";
import { isOrderFinished } from "@/lib/order-status";
import { geoService } from "@/services/geo.service";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: FullOrder;
  customerCoords: Coords | null;
  driverCoords: Coords | null;
  onRouteUpdate: (distanceKm: number, etaMin: number) => void;
}

export function OrderTrackingMapDrawer({
  open,
  onOpenChange,
  order,
  customerCoords,
  driverCoords,
  onRouteUpdate,
}: Props) {
  const [routeFreshAt, setRouteFreshAt] = useState<number | null>(null);

  const { mapEl, mapRef, L, driverMarkerRef, customerMarkerRef, routeLineRef, isReady } =
    useLeafletMap({ enabled: open && !!customerCoords });

  useEffect(() => {
    if (!isReady || !L.current || !mapRef.current || !customerCoords) return;
    const leaflet = L.current;
    const map = mapRef.current;

    const customerIcon = leaflet.divIcon({
      html: '<div style="font-size:20px;line-height:1">📍</div>',
      className: "map-emoji-icon",
      iconSize: [24, 24],
      iconAnchor: [12, 24],
    });
    const driverIcon = leaflet.divIcon({
      html: '<div style="font-size:20px;line-height:1">🏍️</div>',
      className: "map-emoji-icon",
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    if (!customerMarkerRef.current) {
      customerMarkerRef.current = leaflet
        .marker([customerCoords.lat, customerCoords.lng], { icon: customerIcon })
        .addTo(map);
    } else {
      customerMarkerRef.current.setLatLng([customerCoords.lat, customerCoords.lng]);
    }

    if (driverCoords) {
      if (!driverMarkerRef.current) {
        driverMarkerRef.current = leaflet
          .marker([driverCoords.lat, driverCoords.lng], { icon: driverIcon })
          .addTo(map);
      } else {
        driverMarkerRef.current.setLatLng([driverCoords.lat, driverCoords.lng]);
      }
      map.fitBounds(
        leaflet.latLngBounds([
          [customerCoords.lat, customerCoords.lng],
          [driverCoords.lat, driverCoords.lng],
        ]),
        { padding: [24, 24] },
      );
    } else {
      map.setView([customerCoords.lat, customerCoords.lng], 15);
    }
  }, [
    isReady,
    customerCoords?.lat,
    customerCoords?.lng,
    driverCoords?.lat,
    driverCoords?.lng,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    L,
    mapRef,
    driverMarkerRef,
    customerMarkerRef,
  ]);

  useEffect(() => {
    if (!isReady || !driverCoords || !customerCoords || !mapRef.current || !L.current) return;
    let cancelled = false;
    const fetchRoute = async () => {
      try {
        const route = await geoService.drivingRoute(driverCoords, customerCoords);
        if (!route || cancelled) throw new Error("no-route");
        const leaflet = L.current;
        if (!leaflet) return;
        if (routeLineRef.current) {
          routeLineRef.current.setLatLngs(route.path);
        } else {
          routeLineRef.current = leaflet
            .polyline(route.path, { color: "#2563eb", weight: 5 })
            .addTo(mapRef.current!);
        }
        onRouteUpdate(route.distanceKm, Math.max(1, Math.round(route.durationMin)));
        setRouteFreshAt(Date.now());
      } catch {
        const km = haversineKm(driverCoords, customerCoords);
        onRouteUpdate(km, Math.max(1, Math.round((km / SPEED_KMH.osrmFallback) * 60)));
      }
    };
    fetchRoute();
    const id = window.setInterval(fetchRoute, 10_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [
    isReady,
    driverCoords?.lat,
    driverCoords?.lng,
    customerCoords?.lat,
    customerCoords?.lng,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    L,
    mapRef,
    routeLineRef,
    onRouteUpdate,
  ]);

  const isActive = !isOrderFinished(order.status);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90dvh] overflow-y-auto p-0">
        <DrawerHeader className="p-4 pb-0 text-left">
          <DrawerTitle>Rastreamento</DrawerTitle>
        </DrawerHeader>
        <div className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Rastreamento em tempo real</h3>
          </div>
          {isActive && customerCoords ? (
            <>
              <div ref={mapEl} className="h-72 w-full overflow-hidden rounded-lg border bg-muted" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {driverCoords ? "Motorista em movimento" : "Aguardando posição do motorista"}
                </span>
                <span>
                  {routeFreshAt
                    ? `Atualizado ${Math.max(0, Math.round((Date.now() - routeFreshAt) / 1000))}s atrás`
                    : ""}
                </span>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Rastreamento indisponível para o status atual do pedido.
            </p>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
