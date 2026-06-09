import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Clock, Loader2, MapPin, Package, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/integrations/api/client";
import { useAuth } from "@/auth/AuthProvider";
import { toast } from "sonner";
import { formatEta, haversineKm } from "@/lib/distance";
import { fmtMoney, SPEED_KMH } from "@/lib/constants";
import type { DeliveryRating } from "@/components/rating/RatingCard";
import type {
  Coords,
  FullOrder,
  TrackingDriver,
  TrackingProduct,
  TrackingReseller,
} from "@/types/api";
import { OrderStatusSteps } from "@/components/customer/OrderStatusSteps";
import { DriverDetailsDrawer } from "@/components/customer/DriverDetailsDrawer";
import { OrderRatingDrawer } from "@/components/customer/OrderRatingDrawer";
import { OrderTrackingMapDrawer } from "@/components/customer/OrderTrackingMapDrawer";

export const Route = createFileRoute("/customer/order/$orderId")({
  component: OrderTracking,
});

interface OrderTrackingResponse {
  order: FullOrder;
  reseller: TrackingReseller | null;
  driver: TrackingDriver | null;
  product: TrackingProduct | null;
  customerRating: DeliveryRating | null;
}

function OrderTracking() {
  const { orderId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const queryClient = useQueryClient();

  const {
    data,
    isLoading: loading,
    isError,
  } = useQuery({
    queryKey: ["order-tracking", orderId],
    queryFn: () => api.get<OrderTrackingResponse>(`/orders/${orderId}/tracking`),
    enabled: !!user,
    refetchInterval: 10_000,
    retry: false,
  });

  const order = data?.order ?? null;
  const reseller = data?.reseller ?? null;
  const driver = data?.driver ?? null;
  const product = data?.product ?? null;
  const customerRating = data?.customerRating ?? null;

  const [rejecting, setRejecting] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [showDriverDetails, setShowDriverDetails] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingValue, setRatingValue] = useState(5);
  const [deliveryTimeRatingValue, setDeliveryTimeRatingValue] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const [ratingSaving, setRatingSaving] = useState(false);
  const [routeDistanceKm, setRouteDistanceKm] = useState<number | null>(null);
  const [routeEtaMin, setRouteEtaMin] = useState<number | null>(null);

  const confirmRejectDriver = async () => {
    if (!order?.id || !driver?.id) return;
    setRejecting(true);
    setRejectDialogOpen(false);
    try {
      await api.post(`/orders/${order.id}/reject-driver`, { reason: rejectReason.trim() });
      toast.success("Motorista rejeitado. Buscando outro entregador...");
      setRejectReason("");
      await queryClient.invalidateQueries({ queryKey: ["order-tracking", orderId] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao rejeitar motorista");
    } finally {
      setRejecting(false);
    }
  };

  const unblockDriver = async (driverId: string) => {
    try {
      await api.delete(`/customers/me/blocked-drivers/${driverId}`);
      toast.success("Motorista desbloqueado com sucesso.");
      await queryClient.invalidateQueries({ queryKey: ["order-tracking", orderId] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao desbloquear");
    }
  };

  const confirmCancelOrder = async () => {
    if (!order?.id) return;
    setCancelling(true);
    setCancelDialogOpen(false);
    try {
      await api.post(`/orders/${order.id}/cancel`);
      toast.success("Pedido cancelado com sucesso.");
      await queryClient.invalidateQueries({ queryKey: ["order-tracking", orderId] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao cancelar");
    } finally {
      setCancelling(false);
    }
  };

  const deliveryStatusLabel = useMemo(() => {
    if (!order) return "—";
    if (order.status === "accepted" || order.status === "in_delivery") return "Motorista a caminho";
    if (order.status === "pending") return "Aguardando motorista";
    if (order.status === "delivered") return "Entregue";
    if (
      order.status === "cancelled" ||
      order.status === "cancelado_pelo_motorista" ||
      order.status === "cancelled_by_customer"
    )
      return "Cancelado";
    return order.status;
  }, [order]);

  const hasAcceptedDriver =
    !!driver && (order?.status === "accepted" || order?.status === "in_delivery");

  const customerCoords = useMemo((): Coords | null => {
    if (order?.customer_latitude == null || order?.customer_longitude == null) return null;
    return { lat: Number(order.customer_latitude), lng: Number(order.customer_longitude) };
  }, [order?.customer_latitude, order?.customer_longitude]);

  const driverCoords = useMemo((): Coords | null => {
    if (driver?.current_latitude == null || driver?.current_longitude == null) return null;
    return { lat: Number(driver.current_latitude), lng: Number(driver.current_longitude) };
  }, [driver?.current_latitude, driver?.current_longitude]);

  const liveTrip = useMemo(() => {
    if (!customerCoords) return null;
    if (driverCoords) {
      const km = routeDistanceKm ?? haversineKm(driverCoords, customerCoords);
      const eta = routeEtaMin ?? Math.max(1, Math.round((km / SPEED_KMH.driver) * 60));
      return { km, eta, source: routeDistanceKm ? ("route" as const) : ("driver" as const) };
    }
    if (reseller?.latitude != null && reseller.longitude != null) {
      const km = haversineKm(
        { lat: Number(reseller.latitude), lng: Number(reseller.longitude) },
        customerCoords,
      );
      return {
        km,
        eta: Math.max(1, Math.round((km / SPEED_KMH.resellerEstimate) * 60)),
        source: "reseller" as const,
      };
    }
    return null;
  }, [
    customerCoords,
    driverCoords,
    reseller?.latitude,
    reseller?.longitude,
    routeDistanceKm,
    routeEtaMin,
  ]);

  const ratingModalStorageKey = useMemo(
    () => `customer-rating-modal-opened:${order?.id ?? orderId}`,
    [order?.id, orderId],
  );

  useEffect(() => {
    if (!order || order.status !== "delivered" || customerRating) return;
    const alreadyOpened = window.sessionStorage.getItem(ratingModalStorageKey) === "1";
    if (alreadyOpened) return;
    setShowRatingModal(true);
    window.sessionStorage.setItem(ratingModalStorageKey, "1");
  }, [order, customerRating, ratingModalStorageKey]);

  useEffect(() => {
    if (isError) {
      toast.error("Pedido não encontrado");
      navigate({ to: "/customer" });
    }
  }, [isError, navigate]);

  const goHome = () => navigate({ to: "/customer" });

  const submitCustomerRating = async () => {
    if (!order?.id) return;
    setRatingSaving(true);
    try {
      const payload = await api.post<DeliveryRating & { evaluator_role?: "customer" | "driver" }>(
        `/orders/${order.id}/rating`,
        {
          rating: ratingValue,
          comment: ratingComment,
          delivery_time_rating: deliveryTimeRatingValue,
        },
      );
      if (payload.evaluator_role && payload.evaluator_role !== "customer") {
        toast.error("Avaliação recebida de um perfil diferente do esperado. Tente novamente.");
        return;
      }
      setShowRatingModal(false);
      toast.success("Avaliação salva com sucesso");
      goHome();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar avaliação");
    } finally {
      setRatingSaving(false);
    }
  };

  const skipCustomerRating = () => {
    setShowRatingModal(false);
    goHome();
  };

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
                  onClick={() => setShowDriverDetails(true)}
                >
                  Ver detalhes do motorista
                </Button>
              )}
              {hasAcceptedDriver && (
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 rounded-xl"
                  onClick={() => setShowMap(true)}
                >
                  Ver rastreamento
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                className="min-h-11 rounded-xl"
                onClick={() => setShowOrderDetails(true)}
              >
                Detalhes do pedido
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {order.status !== "delivered" &&
        order.status !== "cancelled" &&
        order.status !== "cancelado_pelo_motorista" &&
        order.status !== "cancelled_by_customer" &&
        order.status !== "expired" && (
          <Card>
            <CardContent className="space-y-2 p-5 text-center">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Código de entrega
              </p>
              <div className="text-4xl font-bold tracking-[0.4em] text-primary">
                {order.delivery_code}
              </div>
              <p className="text-xs text-muted-foreground">
                Informe este código ao motorista no momento da entrega.
              </p>
            </CardContent>
          </Card>
        )}

      {order.status === "expired" && (
        <Card className="border-amber-300/60 bg-amber-50/60 dark:bg-amber-900/10">
          <CardContent className="space-y-3 p-5 text-center">
            <div className="flex items-center justify-center gap-2 text-amber-700">
              <Clock className="h-5 w-5" />
              <span className="font-semibold">
                Não encontramos motorista disponível no momento.
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Você pode entrar em contato direto com a revendedora para concluir o pedido.
            </p>
            {reseller?.phone ? (
              <a
                href={`tel:${reseller.phone.replace(/\D/g, "")}`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90"
              >
                📞 Ligar para {reseller.name ?? "revendedora"}
              </a>
            ) : (
              <p className="text-xs text-muted-foreground">Telefone da revendedora indisponível.</p>
            )}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate({ to: "/customer" })}
            >
              Voltar para início
            </Button>
          </CardContent>
        </Card>
      )}

      {driver && hasAcceptedDriver && (
        <DriverDetailsDrawer
          open={showDriverDetails}
          onOpenChange={setShowDriverDetails}
          driver={driver}
          liveTrip={liveTrip}
          order={order}
          deliveryStatusLabel={deliveryStatusLabel}
          rejecting={rejecting}
          onRejectClick={() => setRejectDialogOpen(true)}
          onUnblock={unblockDriver}
        />
      )}

      {(order.status === "pending" ||
        order.status === "accepted" ||
        order.status === "in_delivery") && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground">Precisa interromper este pedido?</div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCancelDialogOpen(true)}
                disabled={cancelling}
              >
                {cancelling ? "Cancelando..." : "Cancelar pedido"}
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
        onRouteUpdate={(km, eta) => {
          setRouteDistanceKm(km);
          setRouteEtaMin(eta);
        }}
      />

      <Drawer open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DrawerContent className="max-h-[85dvh] overflow-y-auto p-0">
          <DrawerHeader className="p-4 pb-0 text-left">
            <DrawerTitle>Detalhes do pedido</DrawerTitle>
          </DrawerHeader>
          <div className="space-y-3 p-4">
            <div className="flex items-center gap-3">
              <Package className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1 text-sm">
                {order.quantity}× {product?.name ?? "Produto"}
              </div>
              <span className="text-sm font-bold">{fmtMoney(order.total_amount)}</span>
            </div>
            <div className="flex items-start gap-3 border-t pt-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="text-sm">
                <div>{order.delivery_address}</div>
                {order.delivery_reference && (
                  <div className="text-xs text-muted-foreground">{order.delivery_reference}</div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
              <span>Revendedora</span>
              <span>{reseller?.name ?? "—"}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Telefone da revendedora</span>
              <span>{reseller?.phone ?? "Não informado"}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Pagamento</span>
              <Badge variant="outline">
                {order.payment_method === "cash"
                  ? "Dinheiro"
                  : order.payment_method === "pix"
                    ? "Pix"
                    : "Cartão"}
              </Badge>
            </div>
            {order.payment_method === "cash" && order.needs_change && order.change_for && (
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Troco para</span>
                <span>
                  {Number(order.change_for).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </span>
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {order.status === "cancelado_pelo_motorista" && (
        <Card>
          <CardContent className="space-y-2 p-4">
            <p className="text-sm">Seu pedido foi cancelado pelo motorista.</p>
            <div className="flex gap-2">
              <Button onClick={() => navigate({ to: "/customer" })}>Refazer pedido</Button>
              <Button variant="outline" onClick={() => navigate({ to: "/customer" })}>
                Escolher outra revendedora
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <OrderRatingDrawer
        open={showRatingModal}
        onOpenChange={setShowRatingModal}
        ratingValue={ratingValue}
        onRatingChange={setRatingValue}
        deliveryTimeRatingValue={deliveryTimeRatingValue}
        onDeliveryTimeRatingChange={setDeliveryTimeRatingValue}
        comment={ratingComment}
        onCommentChange={setRatingComment}
        saving={ratingSaving}
        onSubmit={submitCustomerRating}
        onSkip={skipCustomerRating}
      />

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar pedido?</AlertDialogTitle>
            <AlertDialogDescription>
              {order.status === "accepted" || order.status === "in_delivery"
                ? "O motorista será notificado do cancelamento. Esta ação não pode ser desfeita."
                : "Tem certeza que deseja cancelar este pedido?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmCancelOrder}
            >
              Sim, cancelar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={rejectDialogOpen}
        onOpenChange={(open) => {
          setRejectDialogOpen(open);
          if (!open) setRejectReason("");
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rejeitar motorista?</AlertDialogTitle>
            <AlertDialogDescription>
              O sistema buscará outro entregador disponível. Informe um motivo se quiser.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Motivo (opcional)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="min-h-[80px]"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmRejectDriver}
            >
              Rejeitar motorista
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
