import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  useCancelOrder,
  useOrderTracking,
  useRejectDriver,
  useUnblockDriverForOrder,
} from "@/queries/order.queries";
import { useAuth } from "@/auth/AuthProvider";
import {
  isDriverAssigned,
  isOrderActive,
  isOrderCancelled,
  isOrderFinished,
} from "@/lib/order-status";
import { useOrderLiveTrip } from "@/hooks/useOrderLiveTrip";
import { useOrderRatingPrompt } from "@/hooks/useOrderRatingPrompt";
import { CancelOrderDialog } from "@/components/customer/CancelOrderDialog";
import { DeliveryCodeCard } from "@/components/customer/DeliveryCodeCard";
import { DriverDetailsDrawer } from "@/components/customer/DriverDetailsDrawer";
import { OrderDetailsDrawer } from "@/components/customer/OrderDetailsDrawer";
import { OrderExpiredCard } from "@/components/customer/OrderExpiredCard";
import { OrderRatingDrawer } from "@/components/customer/OrderRatingDrawer";
import { OrderStatusCard } from "@/components/customer/OrderStatusCard";
import { OrderTrackingMapDrawer } from "@/components/customer/OrderTrackingMapDrawer";
import { RejectDriverDialog } from "@/components/customer/RejectDriverDialog";

export const Route = createFileRoute("/customer/order/$orderId")({
  component: OrderTracking,
});

function OrderTracking() {
  const { orderId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data, isLoading: loading, isError } = useOrderTracking(orderId, { enabled: !!user });

  const order = data?.order ?? null;
  const reseller = data?.reseller ?? null;
  const driver = data?.driver ?? null;
  const product = data?.product ?? null;
  const customerRating = data?.customerRating ?? null;

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [showDriverDetails, setShowDriverDetails] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  const goHome = () => navigate({ to: "/customer" });

  const { customerCoords, driverCoords, liveTrip, setRoute } = useOrderLiveTrip(
    order,
    driver,
    reseller,
  );
  const rating = useOrderRatingPrompt(orderId, order, customerRating, goHome);

  const rejectDriver = useRejectDriver(orderId, {
    onSuccess: () => toast.success("Motorista rejeitado. Buscando outro entregador..."),
    onError: (err) => toast.error(err.message || "Erro ao rejeitar motorista"),
  });
  const unblockDriver = useUnblockDriverForOrder(orderId, {
    onSuccess: () => toast.success("Motorista desbloqueado com sucesso."),
    onError: (err) => toast.error(err.message || "Erro ao desbloquear"),
  });
  const cancelOrder = useCancelOrder(orderId, {
    onSuccess: () => toast.success("Pedido cancelado com sucesso."),
    onError: (err) => toast.error(err.message || "Erro ao cancelar"),
  });

  const confirmRejectDriver = (reason: string) => {
    if (!order?.id || !driver?.id) return;
    setRejectDialogOpen(false);
    rejectDriver.mutate(reason);
  };

  const confirmCancelOrder = () => {
    if (!order?.id) return;
    setCancelDialogOpen(false);
    cancelOrder.mutate();
  };

  const deliveryStatusLabel = useMemo(() => {
    if (!order) return "—";
    if (isDriverAssigned(order.status)) return "Motorista a caminho";
    if (order.status === "pending") return "Aguardando motorista";
    if (order.status === "delivered") return "Entregue";
    if (isOrderCancelled(order.status)) return "Cancelado";
    return order.status;
  }, [order]);

  const hasAcceptedDriver = !!driver && !!order && isDriverAssigned(order.status);

  useEffect(() => {
    if (isError) {
      toast.error("Pedido não encontrado");
      navigate({ to: "/customer" });
    }
  }, [isError, navigate]);

  if (loading || !order) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 pb-24">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon">
          <Link to="/customer">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-lg font-bold leading-tight">Acompanhe seu pedido</h1>
          <p className="text-xs text-muted-foreground">#{order.id.slice(0, 8)}</p>
        </div>
      </div>

      <OrderStatusCard
        order={order}
        driver={driver}
        liveTrip={liveTrip}
        hasAcceptedDriver={hasAcceptedDriver}
        onShowDriverDetails={() => setShowDriverDetails(true)}
        onShowMap={() => setShowMap(true)}
        onShowOrderDetails={() => setShowOrderDetails(true)}
      />

      {!isOrderFinished(order.status) && <DeliveryCodeCard code={order.delivery_code} />}

      {order.status === "expired" && <OrderExpiredCard reseller={reseller} onBack={goHome} />}

      {driver && hasAcceptedDriver && (
        <DriverDetailsDrawer
          open={showDriverDetails}
          onOpenChange={setShowDriverDetails}
          driver={driver}
          liveTrip={liveTrip}
          order={order}
          deliveryStatusLabel={deliveryStatusLabel}
          rejecting={rejectDriver.isPending}
          onRejectClick={() => setRejectDialogOpen(true)}
          onUnblock={(driverId) => unblockDriver.mutate(driverId)}
        />
      )}

      {isOrderActive(order.status) && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground">Precisa interromper este pedido?</div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCancelDialogOpen(true)}
                disabled={cancelOrder.isPending}
              >
                {cancelOrder.isPending ? "Cancelando..." : "Cancelar pedido"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">
              Gerencie sua lista de motoristas bloqueados.
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/customer/blocked-drivers">Ver motoristas bloqueados</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <OrderTrackingMapDrawer
        open={showMap}
        onOpenChange={setShowMap}
        order={order}
        customerCoords={customerCoords}
        driverCoords={driverCoords}
        onRouteUpdate={setRoute}
      />

      <OrderDetailsDrawer
        open={showOrderDetails}
        onOpenChange={setShowOrderDetails}
        order={order}
        product={product}
        reseller={reseller}
      />

      {order.status === "cancelado_pelo_motorista" && (
        <Card>
          <CardContent className="space-y-2 p-4">
            <p className="text-sm">Seu pedido foi cancelado pelo motorista.</p>
            <Button onClick={goHome}>Fazer novo pedido</Button>
          </CardContent>
        </Card>
      )}
      <OrderRatingDrawer {...rating} />

      <CancelOrderDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        driverAssigned={isDriverAssigned(order.status)}
        onConfirm={confirmCancelOrder}
      />

      <RejectDriverDialog
        open={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        onConfirm={confirmRejectDriver}
      />
    </div>
  );
}
