import { Banknote, CheckCircle2, CreditCard, Loader2, MapPin, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useLeafletMap } from "@/hooks/useLeafletMap";
import { useDrivingRoute, useTripMarkers } from "@/hooks/useTripMap";
import type { Coords } from "@/types/common";
import type { OrderRow } from "@/types/order";
import { fmtMoney, SPEED_KMH } from "@/lib/constants";
import { getPaymentMethodLabel, isDriverAssigned } from "@/lib/order-status";
import { formatKm } from "@/lib/distance";
import { useConfirm } from "@/components/common/useConfirm";

interface Props {
  order: OrderRow;
  customerName: string | null;
  driverCoords: Coords | null;
  customerCoords: Coords | null;
  straightLineTrip: { km: number; etaMin: number } | null;
  starting: boolean;
  cancelling: boolean;
  onStart: () => void;
  onOpenComplete: () => void;
  onCancel: () => void;
}

export function ActiveOrderCard({
  order,
  customerName,
  driverCoords,
  customerCoords,
  straightLineTrip,
  starting,
  cancelling,
  onStart,
  onOpenComplete,
  onCancel,
}: Props) {
  const { confirm, confirmDialog } = useConfirm();
  const map = useLeafletMap({ enabled: true });
  const { mapEl } = map;
  useTripMarkers(map, driverCoords, customerCoords);
  const { route: routeInfo, loading: routingLoading } = useDrivingRoute(
    map,
    driverCoords,
    customerCoords,
    { fallbackKmh: SPEED_KMH.driverFallback, fitToRoute: true },
  );

  return (
    <Card className="overflow-hidden border-primary/40 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between bg-primary/10 px-5 py-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-primary">
          Entrega em andamento
        </span>
        <Badge variant={order.status === "in_delivery" ? "default" : "secondary"}>
          {order.status === "in_delivery" ? "Em rota" : "Aceito"}
        </Badge>
      </div>
      <CardContent className="space-y-5 p-5">
        <div className="text-center">
          <div className="text-3xl font-bold tracking-tight text-foreground">
            {fmtMoney(order.total_amount)}
          </div>
          <div className="mt-1 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            {order.payment_method === "cash" ? (
              <Banknote className="h-3.5 w-3.5" />
            ) : (
              <CreditCard className="h-3.5 w-3.5" />
            )}
            {getPaymentMethodLabel(order.payment_method)} • {order.quantity}×{" "}
            {fmtMoney(order.unit_price)}
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-xl bg-muted/60 p-3">
          <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-foreground">{order.delivery_address}</div>
            {order.delivery_reference && (
              <div className="mt-0.5 text-xs text-muted-foreground">{order.delivery_reference}</div>
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-3 text-sm space-y-1">
          <div className="font-semibold">{customerName ?? "Cliente"}</div>
          {routeInfo ? (
            <>
              <div className="text-xs text-muted-foreground">
                Distância: {formatKm(routeInfo.distanceKm)}
              </div>
              <div className="text-xs text-muted-foreground">
                Tempo estimado: {Math.round(routeInfo.durationMin)} min
              </div>
            </>
          ) : straightLineTrip ? (
            <>
              <div className="text-xs text-muted-foreground">
                Distância estimada: {formatKm(straightLineTrip.km)}
              </div>
              <div className="text-xs text-muted-foreground">
                Tempo estimado: {straightLineTrip.etaMin} min
              </div>
            </>
          ) : (
            <div className="text-xs text-muted-foreground">
              Aguardando localização para estimar distância e tempo.
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-xl border bg-card">
          <div ref={mapEl} className="h-64 w-full" />
          {routingLoading && (
            <div className="p-2 text-center text-xs text-muted-foreground">Calculando rota...</div>
          )}
          {(!driverCoords || !customerCoords) && (
            <div className="p-2 text-center text-xs text-muted-foreground">
              Aguardando localização para exibir mapa da rota.
            </div>
          )}
        </div>

        {order.payment_method === "cash" && order.needs_change && order.change_for && (
          <div className="rounded-xl border border-primary/40 bg-primary/5 p-3 text-sm">
            <span className="font-semibold text-primary">Levar troco para </span>
            {fmtMoney(Number(order.change_for))}
            <span className="text-muted-foreground">
              {" "}
              (troco: {fmtMoney(Number(order.change_for) - order.total_amount)})
            </span>
          </div>
        )}

        {order.payment_method === "pix" && (
          <div className="rounded-xl border border-primary/40 bg-primary/5 p-3 text-sm text-primary">
            Pagamento via Pix — combine com o cliente
          </div>
        )}

        {order.notes && (
          <div className="rounded-lg bg-warning/10 px-3 py-2 text-xs text-foreground">
            <strong>Obs:</strong> {order.notes}
          </div>
        )}

        {order.status === "accepted" ? (
          <Button
            size="lg"
            className="h-14 w-full text-base font-semibold"
            onClick={onStart}
            disabled={starting}
          >
            {starting ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Truck className="mr-2 h-5 w-5" />
            )}
            Iniciar entrega
          </Button>
        ) : (
          <Button
            size="lg"
            className="h-14 w-full text-base font-semibold"
            onClick={onOpenComplete}
          >
            <CheckCircle2 className="mr-2 h-5 w-5" /> Confirmar entrega
          </Button>
        )}

        {isDriverAssigned(order.status) && (
          <Button
            variant="outline"
            className="w-full"
            disabled={cancelling}
            onClick={async () => {
              const ok = await confirm({
                title: "Cancelar esta entrega?",
                description:
                  "O pedido será cancelado e o cliente verá que foi cancelado pelo motorista.",
                confirmLabel: "Cancelar entrega",
                cancelLabel: "Voltar",
                destructive: true,
              });
              if (ok) onCancel();
            }}
          >
            {cancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Cancelar entrega
          </Button>
        )}
      </CardContent>
      {confirmDialog}
    </Card>
  );
}
