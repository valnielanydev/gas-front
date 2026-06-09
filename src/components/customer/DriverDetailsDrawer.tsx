import { MapPin, Star, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import type { FullOrder, TrackingDriver } from "@/types/api";
import { formatEta, formatKm } from "@/lib/distance";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  driver: TrackingDriver;
  liveTrip: { km: number; eta: number; source: "route" | "driver" | "reseller" } | null;
  order: FullOrder;
  deliveryStatusLabel: string;
  rejecting: boolean;
  onRejectClick: () => void;
  onUnblock: (driverId: string) => void;
}

export function DriverDetailsDrawer({
  open,
  onOpenChange,
  driver,
  liveTrip,
  order,
  deliveryStatusLabel,
  rejecting,
  onRejectClick,
  onUnblock,
}: Props) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85dvh] overflow-y-auto p-0">
        <DrawerHeader className="p-4 pb-0 text-left">
          <DrawerTitle>Detalhes do motorista</DrawerTitle>
        </DrawerHeader>
        <div className="space-y-4 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold">{driver.name ?? "Motorista"}</div>
                <div className="text-xs text-muted-foreground">
                  {driver.vehicle_model ?? "Veículo"} • {driver.vehicle_plate ?? "—"}
                </div>
                <div className="mt-1 flex items-center gap-1 text-xs text-amber-600">
                  <Star className="h-3.5 w-3.5" />
                  {driver.rating ? Number(driver.rating).toFixed(1) : "Sem avaliação"}
                  {driver.delivery_time_rating
                    ? ` • ⏱️ ${Number(driver.delivery_time_rating).toFixed(1)}`
                    : ""}
                </div>
              </div>
            </div>
          </div>

          {liveTrip &&
            order.status !== "delivered" &&
            order.status !== "cancelled" &&
            order.status !== "cancelado_pelo_motorista" && (
              <div className="flex items-center justify-between rounded-lg bg-primary/5 px-3 py-2 text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" /> {formatKm(liveTrip.km)}
                </span>
                <span className="font-semibold text-primary">{formatEta(liveTrip.eta)}</span>
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {liveTrip.source === "route"
                    ? "rota"
                    : liveTrip.source === "driver"
                      ? "ao vivo"
                      : "estimado"}
                </span>
              </div>
            )}

          <div className="flex flex-wrap gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={onRejectClick}
              disabled={rejecting}
              aria-label="Rejeitar motorista"
            >
              {rejecting ? "Rejeitando..." : "🚫 Rejeitar motorista"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onUnblock(driver.id)}
              aria-label="Desbloquear motorista"
            >
              🔓 Desbloquear
            </Button>
          </div>

          <div className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
            Status da entrega:{" "}
            <span className="font-semibold text-foreground">{deliveryStatusLabel}</span>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
