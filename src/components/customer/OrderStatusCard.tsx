import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { OrderStatusSteps } from "@/components/customer/OrderStatusSteps";
import type { LiveTrip } from "@/hooks/useOrderLiveTrip";
import { formatEta } from "@/lib/distance";
import type { FullOrder, TrackingDriver } from "@/types/order";

interface Props {
  order: FullOrder;
  driver: TrackingDriver | null;
  liveTrip: LiveTrip | null;
  hasAcceptedDriver: boolean;
  onShowDriverDetails: () => void;
  onShowMap: () => void;
  onShowOrderDetails: () => void;
}

export function OrderStatusCard({
  order,
  driver,
  liveTrip,
  hasAcceptedDriver,
  onShowDriverDetails,
  onShowMap,
  onShowOrderDetails,
}: Props) {
  return (
    <Card className="overflow-hidden border-primary/30">
      <div className="bg-primary/10 px-5 py-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-primary">
          Status atual
        </span>
      </div>
      <CardContent className="p-5">
        <OrderStatusSteps order={order} />
        <div className="mt-4 space-y-3 border-t pt-4">
          {driver && (
            <div className="rounded-xl bg-primary/5 px-3 py-2 text-sm">
              <div className="font-semibold">{driver.name ?? "Motorista"}</div>
              <div className="text-xs text-muted-foreground">
                A caminho • {liveTrip ? formatEta(liveTrip.eta) : "Calculando ETA..."}
              </div>
            </div>
          )}
          <div className="grid gap-2 sm:grid-cols-3">
            {hasAcceptedDriver && (
              <Button
                type="button"
                variant="outline"
                className="min-h-11 rounded-xl"
                onClick={onShowDriverDetails}
              >
                Ver detalhes do motorista
              </Button>
            )}
            {hasAcceptedDriver && (
              <Button
                type="button"
                variant="outline"
                className="min-h-11 rounded-xl"
                onClick={onShowMap}
              >
                Ver rastreamento
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              className="min-h-11 rounded-xl"
              onClick={onShowOrderDetails}
            >
              Detalhes do pedido
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
