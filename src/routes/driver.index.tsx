import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDriverLocation } from "@/hooks/useDriverLocation";
import { Flame, Loader2, Power, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useAuth } from "@/auth/AuthProvider";
import { estimateEtaMinutes, formatKm, haversineKm } from "@/lib/distance";
import { DriverBottomNav } from "@/components/DriverBottomNav";
import { DriverNavigation } from "@/components/DriverNavigation";
import type {
  Coords,
  CustomerDetails,
  DriverDashboardData,
  DriverRow,
  OrderRow,
} from "@/types/api";
import { DriverDashboardCards } from "@/components/driver/DriverDashboardCards";
import { ActiveOrderCard } from "@/components/driver/ActiveOrderCard";
import { PendingOrdersSection } from "@/components/driver/PendingOrdersSection";
import { DeliveryCompleteDialog } from "@/components/driver/DeliveryCompleteDialog";
import { DeliveryRatingDrawer } from "@/components/driver/DeliveryRatingDrawer";
import { driverService } from "@/services/driver.service";
import { orderService } from "@/services/order.service";

export const Route = createFileRoute("/driver/")({ component: DriverPage });

function DriverPage() {
  const { user, isAuthenticated, isLoading: authLoading, hasRole } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [driver, setDriver] = useState<DriverRow | null>(null);
  const [available, setAvailableOrders] = useState<OrderRow[]>([]);
  const [active, setActive] = useState<OrderRow | null>(null);

  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [code, setCode] = useState("");
  const [completing, setCompleting] = useState(false);
  const [togglingOnline, setTogglingOnline] = useState(false);
  const [customerMap, setCustomerMap] = useState<Record<string, CustomerDetails>>({});
  const [cancelling, setCancelling] = useState(false);
  const [rateOpen, setRateOpen] = useState(false);
  const [ratingOrderId, setRatingOrderId] = useState<string | null>(null);
  const [ratingValue, setRatingValue] = useState<number>(5);
  const [ratingComment, setRatingComment] = useState("");
  const [ratingSaving, setRatingSaving] = useState(false);
  const [selectedPendingOrderId, setSelectedPendingOrderId] = useState<string | null>(null);
  const [liveDriverCoords, setLiveDriverCoords] = useState<Coords | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboard, setDashboard] = useState<DriverDashboardData | null>(null);

  const driverRef = useRef<DriverRow | null>(null);
  driverRef.current = driver;

  const hydrateCustomerDetails = useCallback(async (orders: OrderRow[]) => {
    if (!orders.length) {
      setCustomerMap({});
      return;
    }
    const ids = orders.map((o) => o.id);
    try {
      const rows = await driverService.customerDetails<{
        order_id: string;
        customer_name: string | null;
      }>(ids);
      const byOrder: Record<string, CustomerDetails> = {};
      rows.forEach((r) => {
        byOrder[r.order_id] = { customer_name: r.customer_name };
      });
      setCustomerMap(byOrder);
    } catch {
      setCustomerMap({});
    }
  }, []);

  const loadDashboard = useCallback(async () => {
    setDashboardLoading(true);
    try {
      const data = await driverService.dashboard<DriverDashboardData>();
      setDashboard(data);
    } catch {
      setDashboard(null);
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate({ to: "/login", replace: true });
    } else if (!hasRole("driver")) {
      navigate({ to: "/", replace: true });
    }
  }, [authLoading, isAuthenticated, hasRole, navigate]);

  // Stable fetch function for orders — reads driver via ref so no deps churn
  const fetchOrdersData = useCallback(async () => {
    const drv = driverRef.current;
    if (!drv) return null;
    const activeOrder = await driverService.activeOrder<OrderRow>().catch(() => null);
    if (!activeOrder && drv.approval_status === "active") {
      const pending = await driverService.pendingOrders<OrderRow>().catch(() => [] as OrderRow[]);
      return { active: activeOrder, pending };
    }
    return { active: activeOrder, pending: [] as OrderRow[] };
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const drv = await driverService.me<DriverRow>();
        if (cancelled) return;
        setDriver(drv);
        await loadDashboard();
      } catch {
        if (!cancelled) toast.error("Cadastro de motorista não encontrado.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, loadDashboard]);

  const queryClient = useQueryClient();

  const { data: ordersData } = useQuery({
    queryKey: ["driver-orders", driver?.id],
    queryFn: fetchOrdersData,
    enabled: !!driver?.id,
    refetchInterval: 15_000,
    staleTime: 0,
  });

  useEffect(() => {
    if (!ordersData) return;
    setActive(ordersData.active);
    setAvailableOrders(ordersData.pending);
    void hydrateCustomerDetails(ordersData.active ? [ordersData.active] : ordersData.pending);
  }, [ordersData, hydrateCustomerDetails]);

  useDriverLocation({
    driverId: driver?.id,
    driverStatus: driver?.status,
    activeOrderId: active?.id ?? null,
    onLocationUpdate: setLiveDriverCoords,
    onGpsError: (count) => {
      if (count === 3) toast.warning("GPS indisponível. Verifique as permissões de localização.");
    },
  });

  useEffect(() => {
    if (!active) return;
    setSelectedPendingOrderId(null);
  }, [active?.id]);

  useEffect(() => {
    if (!active) return;
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (p) => setLiveDriverCoords({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 12_000 },
    );
  }, [active?.id]);

  const toggleOnline = async (next: boolean) => {
    if (!driver) return;
    setTogglingOnline(true);
    const newStatus = next ? "available" : "offline";
    try {
      await driverService.updateStatus(newStatus);
      setDriver({ ...driver, status: newStatus });
      toast.success(next ? "Você está online" : "Você está offline");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setTogglingOnline(false);
    }
  };

  const acceptOrder = async (orderId: string) => {
    setAcceptingId(orderId);
    try {
      const accepted = await orderService.accept<OrderRow>(orderId);
      toast.success("Pedido aceito!");
      setActive(accepted);
      setAvailableOrders((prev) => prev.filter((o) => o.id !== orderId));
      if (driver) setDriver({ ...driver, status: "busy" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível aceitar.");
      if (driver?.id)
        void queryClient.invalidateQueries({ queryKey: ["driver-orders", driver.id] });
    } finally {
      setAcceptingId(null);
    }
  };

  const startDelivery = async () => {
    if (!active) return;
    setStarting(true);
    try {
      const updated = await driverService.startDelivery<OrderRow>(active.id);
      setActive(updated);
      toast.success("Entrega iniciada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setStarting(false);
    }
  };

  const completeDelivery = async () => {
    if (!active) return;
    if (code.length !== 4) {
      toast.error("Digite os 4 dígitos do código");
      return;
    }
    setCompleting(true);
    try {
      await orderService.complete(active.id, code);
      toast.success("Pedido entregue!");
      setCompleteOpen(false);
      setCode("");
      const deliveredOrderId = active.id;
      setActive(null);
      if (driver) {
        const refreshed = { ...driver, status: "available" as const };
        setDriver(refreshed);
        void queryClient.invalidateQueries({ queryKey: ["driver-orders", driver.id] });
        void loadDashboard();
      }
      setRatingOrderId(deliveredOrderId);
      setRateOpen(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Código inválido");
    } finally {
      setCompleting(false);
    }
  };

  const cancelDelivery = async () => {
    if (!active) return;
    setCancelling(true);
    try {
      await orderService.cancelByDriver(active.id);
      toast.success("Entrega cancelada");
      setActive(null);
      if (driver) {
        const refreshed = { ...driver, status: "available" as const };
        setDriver(refreshed);
        void queryClient.invalidateQueries({ queryKey: ["driver-orders", driver.id] });
        void loadDashboard();
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setCancelling(false);
    }
  };

  const submitDriverRating = async () => {
    if (!ratingOrderId) return;
    setRatingSaving(true);
    try {
      await orderService.rate(ratingOrderId, {
        rating: ratingValue,
        comment: ratingComment,
        delivery_time_rating: null,
      });
      toast.success("Avaliação enviada");
      setRateOpen(false);
      setRatingOrderId(null);
      setRatingComment("");
      setRatingValue(5);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setRatingSaving(false);
    }
  };

  const isOnline = driver?.status !== "offline";
  const isApproved = driver?.approval_status === "active";

  const headerSubtitle = useMemo(() => {
    if (!driver) return "";
    if (driver.approval_status === "pending") return "Aguardando aprovação";
    if (driver.approval_status === "inactive") return "Conta inativa";
    return isOnline ? "Online" : "Offline";
  }, [driver, isOnline]);

  const distanceLabel = useCallback(
    (order: OrderRow) => {
      if (
        driver?.current_latitude == null ||
        driver?.current_longitude == null ||
        order.customer_latitude == null ||
        order.customer_longitude == null
      )
        return null;
      const km = haversineKm(
        { lat: Number(driver.current_latitude), lng: Number(driver.current_longitude) },
        { lat: Number(order.customer_latitude), lng: Number(order.customer_longitude) },
      );
      return formatKm(km);
    },
    [driver?.current_latitude, driver?.current_longitude],
  );

  const activeCustomerCoords: Coords | null =
    active?.customer_latitude != null && active?.customer_longitude != null
      ? { lat: Number(active.customer_latitude), lng: Number(active.customer_longitude) }
      : null;

  const persistedDriverCoords: Coords | null =
    driver?.current_latitude != null && driver?.current_longitude != null
      ? { lat: Number(driver.current_latitude), lng: Number(driver.current_longitude) }
      : null;

  const driverCoords = liveDriverCoords ?? persistedDriverCoords;

  const straightLineTrip =
    driverCoords && activeCustomerCoords
      ? (() => {
          const km = haversineKm(driverCoords, activeCustomerCoords);
          return { km, etaMin: estimateEtaMinutes(km, { prepMinutes: 0, avgKmh: 35 }) };
        })()
      : null;

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <Truck className="h-12 w-12 text-muted-foreground" />
        <h1 className="text-xl font-semibold">Cadastro não encontrado</h1>
        <p className="text-sm text-muted-foreground">
          Sua conta não está vinculada a uma revendedora como motorista.
        </p>
        <p className="text-xs text-muted-foreground">
          Peça à revendedora um link de convite para se cadastrar como motorista.
        </p>
      </div>
    );
  }

  return (
    <DriverNavigation>
      <div className="min-h-screen bg-muted">
        <header className="sticky top-0 z-10 border-b border-border bg-card">
          <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Flame className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-bold leading-tight">VaptGás Motorista</div>
                <div className="text-xs text-muted-foreground">{headerSubtitle}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isApproved && (
                <div className="flex items-center gap-2">
                  <Power
                    className={`h-4 w-4 ${isOnline ? "text-primary" : "text-muted-foreground"}`}
                  />
                  <Switch
                    checked={isOnline}
                    disabled={togglingOnline || !!active}
                    onCheckedChange={toggleOnline}
                    aria-label={isOnline ? "Ficar offline" : "Ficar online"}
                  />
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-2xl px-4 py-4 space-y-4">
          {isApproved && (
            <section className="space-y-2">
              <DriverDashboardCards
                loading={dashboardLoading}
                dashboard={dashboard}
                isOnline={isOnline}
                hasActiveOrder={!!active}
              />
            </section>
          )}

          {!isApproved && (
            <Card>
              <CardContent className="pt-6 text-center">
                <Truck className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                <h2 className="text-lg font-semibold">
                  {driver.approval_status === "pending"
                    ? "Aguardando aprovação da revendedora"
                    : "Conta inativa"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {driver.approval_status === "pending"
                    ? "Você será notificado assim que sua conta for aprovada."
                    : "Entre em contato com a revendedora."}
                </p>
              </CardContent>
            </Card>
          )}

          {isApproved && active && (
            <ActiveOrderCard
              order={active}
              customerName={customerMap[active.id]?.customer_name ?? null}
              driverCoords={driverCoords}
              customerCoords={activeCustomerCoords}
              straightLineTrip={straightLineTrip}
              starting={starting}
              cancelling={cancelling}
              onStart={startDelivery}
              onOpenComplete={() => setCompleteOpen(true)}
              onCancel={cancelDelivery}
            />
          )}

          {isApproved && !active && (
            <PendingOrdersSection
              isOnline={isOnline}
              orders={available}
              customerMap={customerMap}
              distanceLabel={distanceLabel}
              selectedId={selectedPendingOrderId}
              onSelect={setSelectedPendingOrderId}
              acceptingId={acceptingId}
              onAccept={acceptOrder}
            />
          )}
        </main>

        <DriverBottomNav />

        <DeliveryCompleteDialog
          open={completeOpen}
          onOpenChange={setCompleteOpen}
          code={code}
          onCodeChange={setCode}
          onConfirm={completeDelivery}
          completing={completing}
        />

        <DeliveryRatingDrawer
          open={rateOpen}
          onOpenChange={setRateOpen}
          ratingValue={ratingValue}
          onRatingChange={setRatingValue}
          comment={ratingComment}
          onCommentChange={setRatingComment}
          saving={ratingSaving}
          onSubmit={submitDriverRating}
        />
      </div>
    </DriverNavigation>
  );
}
