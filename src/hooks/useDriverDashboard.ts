import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/auth/AuthProvider";
import { useDriverLocation } from "@/hooks/useDriverLocation";
import { estimateEtaMinutes, formatKm, haversineKm } from "@/lib/distance";
import { driverKeys } from "@/queries/keys";
import {
  useCurrentDriver,
  useDriverDashboardMetrics,
  useOrdersCustomerDetails,
} from "@/queries/driver.queries";
import { driverService } from "@/services/driver.service";
import { orderService } from "@/services/order.service";
import type { Coords } from "@/types/common";
import type { CustomerDetails, DriverOnlineStatus, DriverRow } from "@/types/driver";
import type { OrderRow } from "@/types/order";

interface DriverOrders {
  active: OrderRow | null;
  pending: OrderRow[];
}

const NO_ORDERS: OrderRow[] = [];

/**
 * State and actions behind the driver home screen: driver record, active/pending
 * orders (polled), dashboard metrics, live location and the delivery lifecycle.
 */
export function useDriverDashboard() {
  const { user } = useAuth();

  const queryClient = useQueryClient();
  const driverQuery = useCurrentDriver(user?.id);
  const driver = driverQuery.data ?? null;
  const loading = !!user && driverQuery.isPending;

  const [selectedPendingOrderId, setSelectedPendingOrderId] = useState<string | null>(null);
  const [liveDriverCoords, setLiveDriverCoords] = useState<Coords | null>(null);

  useEffect(() => {
    if (driverQuery.isError) toast.error("Cadastro de motorista não encontrado.");
  }, [driverQuery.isError]);

  /** Local status changes (online, busy...) are written straight into the cached record. */
  const setDriverStatus = (status: DriverRow["status"]) =>
    queryClient.setQueryData<DriverRow>(driverKeys.self(user?.id), (prev) =>
      prev ? { ...prev, status } : prev,
    );

  const dashboardQuery = useDriverDashboardMetrics(user?.id, !!driver);
  const dashboard = dashboardQuery.data ?? null;
  const dashboardLoading = !dashboardQuery.data && dashboardQuery.isFetching;

  const ordersKey = driverKeys.orders(driver?.id);
  const ordersQuery = useQuery({
    queryKey: ordersKey,
    queryFn: async (): Promise<DriverOrders> => {
      const active = await driverService.activeOrder().catch(() => null);
      // Only an approved driver without a delivery in progress is offered new orders
      if (active || driver?.approval_status !== "active") return { active, pending: [] };
      const pending = await driverService.pendingOrders().catch(() => [] as OrderRow[]);
      return { active: null, pending };
    },
    enabled: !!driver?.id,
    refetchInterval: 15_000,
    staleTime: 0,
  });
  const active = ordersQuery.data?.active ?? null;
  const available = ordersQuery.data?.pending ?? NO_ORDERS;
  const activeId = active?.id ?? null;

  /**
   * Writes an action's result into the orders cache. An in-flight poll is cancelled first:
   * it started before the action and would overwrite the result with stale data.
   */
  const setOrders = async (next: DriverOrders) => {
    await queryClient.cancelQueries({ queryKey: ordersKey });
    queryClient.setQueryData<DriverOrders>(ordersKey, next);
  };

  /** Back to "available" after a delivery ends: refetch orders and the day's metrics. */
  const finishActiveOrder = async () => {
    await setOrders({ active: null, pending: [] });
    setDriverStatus("available");
    void queryClient.invalidateQueries({ queryKey: ordersKey });
    void queryClient.invalidateQueries({ queryKey: driverKeys.selfDashboard(user?.id) });
  };

  // Customer names for the orders on screen: the active one, or the pending list
  const customerOrderIds = useMemo(
    () => (active ? [active] : available).map((o) => o.id),
    [active, available],
  );
  const customerDetailsQuery = useOrdersCustomerDetails(user?.id, customerOrderIds);
  const customerMap = useMemo(() => {
    const byOrder: Record<string, CustomerDetails> = {};
    if (!customerOrderIds.length) return byOrder;
    customerDetailsQuery.data?.forEach((r) => {
      byOrder[r.order_id] = { customer_name: r.customer_name };
    });
    return byOrder;
  }, [customerDetailsQuery.data, customerOrderIds]);

  useDriverLocation({
    driverId: driver?.id,
    driverStatus: driver?.status,
    activeOrderId: activeId,
    onLocationUpdate: setLiveDriverCoords,
    onGpsError: (count) => {
      if (count === 3) toast.warning("GPS indisponível. Verifique as permissões de localização.");
    },
  });

  useEffect(() => {
    if (activeId) setSelectedPendingOrderId(null);
  }, [activeId]);

  // Fresh position as soon as a delivery starts, without waiting for the location watcher
  useEffect(() => {
    if (!activeId) return;
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (p) => setLiveDriverCoords({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 12_000 },
    );
  }, [activeId]);

  const toggleOnlineMutation = useMutation({
    mutationFn: (status: DriverOnlineStatus) => driverService.updateStatus(status),
    onSuccess: (_data, status) => {
      setDriverStatus(status);
      toast.success(status === "offline" ? "Você está offline" : "Você está online");
    },
    onError: (e) => toast.error(e.message || "Erro"),
  });

  const acceptMutation = useMutation({
    mutationFn: (orderId: string) => orderService.accept(orderId),
    onSuccess: async (accepted, orderId) => {
      toast.success("Pedido aceito!");
      await setOrders({ active: accepted, pending: available.filter((o) => o.id !== orderId) });
      setDriverStatus("busy");
    },
    onError: (e) => {
      toast.error(e.message || "Não foi possível aceitar.");
      // Most likely another driver took it: show the current list
      void queryClient.invalidateQueries({ queryKey: ordersKey });
    },
  });

  const startMutation = useMutation({
    mutationFn: (orderId: string) => driverService.startDelivery(orderId),
    onSuccess: async (updated) => {
      await setOrders({ active: updated, pending: [] });
      toast.success("Entrega iniciada");
    },
    onError: (e) => toast.error(e.message || "Erro"),
  });

  const completeMutation = useMutation({
    mutationFn: ({ orderId, code }: { orderId: string; code: string }) =>
      orderService.complete(orderId, code),
    onSuccess: async () => {
      toast.success("Pedido entregue!");
      await finishActiveOrder();
    },
    onError: (e) => toast.error(e.message || "Código inválido"),
  });

  const cancelMutation = useMutation({
    mutationFn: (orderId: string) => orderService.cancelByDriver(orderId),
    onSuccess: async () => {
      toast.success("Entrega cancelada");
      await finishActiveOrder();
    },
    onError: (e) => toast.error(e.message || "Erro"),
  });

  const toggleOnline = (next: boolean) => {
    if (!driver) return;
    toggleOnlineMutation.mutate(next ? "available" : "offline");
  };

  const acceptOrder = (orderId: string) => acceptMutation.mutate(orderId);

  const startDelivery = () => {
    if (active) startMutation.mutate(active.id);
  };

  /** Returns the delivered order id on success, `null` otherwise. */
  const completeDelivery = async (code: string): Promise<string | null> => {
    if (!active) return null;
    if (code.length !== 4) {
      toast.error("Digite os 4 dígitos do código");
      return null;
    }
    try {
      await completeMutation.mutateAsync({ orderId: active.id, code });
      return active.id;
    } catch {
      return null; // already reported by onError
    }
  };

  const cancelDelivery = () => {
    if (active) cancelMutation.mutate(active.id);
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
    togglingOnline: toggleOnlineMutation.isPending,
    acceptingId: acceptMutation.isPending ? acceptMutation.variables : null,
    starting: startMutation.isPending,
    completing: completeMutation.isPending,
    cancelling: cancelMutation.isPending,
    toggleOnline,
    acceptOrder,
    startDelivery,
    completeDelivery,
    cancelDelivery,
  };
}
