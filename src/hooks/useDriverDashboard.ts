import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/auth/AuthProvider";
import { useDriverLocation } from "@/hooks/useDriverLocation";
import { estimateEtaMinutes, formatKm, haversineKm } from "@/lib/distance";
import { driverKeys } from "@/queries/keys";
import { driverService } from "@/services/driver.service";
import { orderService } from "@/services/order.service";
import type { Coords } from "@/types/common";
import type { CustomerDetails, DriverDashboardData, DriverRow } from "@/types/driver";
import type { OrderRow } from "@/types/order";

/**
 * State and actions behind the driver home screen: driver record, active/pending
 * orders (polled), dashboard metrics, live location and the delivery lifecycle.
 */
export function useDriverDashboard() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [driver, setDriver] = useState<DriverRow | null>(null);
  const [available, setAvailableOrders] = useState<OrderRow[]>([]);
  const [active, setActive] = useState<OrderRow | null>(null);

  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [togglingOnline, setTogglingOnline] = useState(false);
  const [customerMap, setCustomerMap] = useState<Record<string, CustomerDetails>>({});
  const [cancelling, setCancelling] = useState(false);
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
      const rows = await driverService.customerDetails(ids);
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
      const data = await driverService.dashboard();
      setDashboard(data);
    } catch {
      setDashboard(null);
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  // Stable fetch function for orders — reads driver via ref so no deps churn
  const fetchOrdersData = useCallback(async () => {
    const drv = driverRef.current;
    if (!drv) return null;
    const activeOrder = await driverService.activeOrder().catch(() => null);
    if (!activeOrder && drv.approval_status === "active") {
      const pending = await driverService.pendingOrders().catch(() => [] as OrderRow[]);
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
        const drv = await driverService.me();
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
    queryKey: driverKeys.orders(driver?.id),
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
      const accepted = await orderService.accept(orderId);
      toast.success("Pedido aceito!");
      setActive(accepted);
      setAvailableOrders((prev) => prev.filter((o) => o.id !== orderId));
      if (driver) setDriver({ ...driver, status: "busy" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível aceitar.");
      if (driver?.id)
        void queryClient.invalidateQueries({ queryKey: driverKeys.orders(driver.id) });
    } finally {
      setAcceptingId(null);
    }
  };

  const startDelivery = async () => {
    if (!active) return;
    setStarting(true);
    try {
      const updated = await driverService.startDelivery(active.id);
      setActive(updated);
      toast.success("Entrega iniciada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setStarting(false);
    }
  };

  /** Returns the delivered order id on success, `null` otherwise. */
  const completeDelivery = async (code: string): Promise<string | null> => {
    if (!active) return null;
    if (code.length !== 4) {
      toast.error("Digite os 4 dígitos do código");
      return null;
    }
    setCompleting(true);
    try {
      await orderService.complete(active.id, code);
      toast.success("Pedido entregue!");
      const deliveredOrderId = active.id;
      setActive(null);
      if (driver) {
        const refreshed = { ...driver, status: "available" as const };
        setDriver(refreshed);
        void queryClient.invalidateQueries({ queryKey: driverKeys.orders(driver.id) });
        void loadDashboard();
      }
      return deliveredOrderId;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Código inválido");
      return null;
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
        void queryClient.invalidateQueries({ queryKey: driverKeys.orders(driver.id) });
        void loadDashboard();
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setCancelling(false);
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

  return {
    loading,
    driver,
    isOnline,
    isApproved,
    headerSubtitle,
    dashboard,
    dashboardLoading,
    available,
    active,
    customerMap,
    distanceLabel,
    driverCoords,
    activeCustomerCoords,
    straightLineTrip,
    selectedPendingOrderId,
    setSelectedPendingOrderId,
    togglingOnline,
    acceptingId,
    starting,
    completing,
    cancelling,
    toggleOnline,
    acceptOrder,
    startDelivery,
    completeDelivery,
    cancelDelivery,
  };
}
