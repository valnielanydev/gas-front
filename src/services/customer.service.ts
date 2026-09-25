import { api } from "@/integrations/api/client";

type LastDeliveryAddress = {
  delivery_address: string;
  delivery_latitude: number | null;
  delivery_longitude: number | null;
};

export type BlockedDriver = {
  driver_id: string;
  driver_name: string | null;
  blocked_at: string;
};

export const customerService = {
  lastDeliveryAddress: () =>
    api.get<LastDeliveryAddress | null>("/customers/me/last-delivery-address"),

  activeOrder: () => api.get<{ id: string } | null>("/customers/me/active-order"),

  updateProfile: (payload: { name: string | null; phone: string | null }) =>
    api.patch("/users/me", payload),

  listBlockedDrivers: () => api.get<BlockedDriver[]>("/customers/me/blocked-drivers"),

  unblockDriver: (driverId: string) => api.delete(`/customers/me/blocked-drivers/${driverId}`),

  listOrders: <T>(limit: number, offset: number) =>
    api.get<{ orders: T[]; hasMore: boolean }>(
      `/customers/me/orders?limit=${limit}&offset=${offset}`,
    ),

  ratingsForOrders: <T>(orderIds: string[]) =>
    api.post<Record<string, T>>("/customers/me/ratings", { orderIds }),

  driverMetricsForOrders: (orderIds: string[]) =>
    api.post<Record<string, { rating: number | null; delivery_time_rating: number | null }>>(
      "/customers/me/driver-metrics",
      { orderIds },
    ),
};
