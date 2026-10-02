import { useEffect, useRef } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useLeafletMap } from "@/hooks/useLeafletMap";
import { useDrivingRoute, useTripMarkers } from "@/hooks/useTripMap";
import type { Coords } from "@/types/common";
import type { FullOrder } from "@/types/order";
import { SPEED_KMH } from "@/lib/constants";
import { isOrderFinished } from "@/lib/order-status";

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
  const map = useLeafletMap({ enabled: open && !!customerCoords });
  const { mapEl } = map;
  useTripMarkers(map, driverCoords, customerCoords, { centerOnCustomer: true });
  const { route } = useDrivingRoute(map, driverCoords, customerCoords, {
    fallbackKmh: SPEED_KMH.osrmFallback,
  });
  const routeFreshAt = route && !route.isEstimate ? route.updatedAt : null;

  const onRouteUpdateRef = useRef(onRouteUpdate);
  onRouteUpdateRef.current = onRouteUpdate;
  useEffect(() => {
    if (route)
      onRouteUpdateRef.current(route.distanceKm, Math.max(1, Math.round(route.durationMin)));
  }, [route]);

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
