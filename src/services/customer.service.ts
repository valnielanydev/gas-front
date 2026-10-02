import { api } from "@/integrations/api/client";
import type { Paginated } from "@/types/common";
import type {
  BlockedDriver,
  DriverMetrics,
  LastDeliveryAddress,
  UpdateCustomerProfilePayload,
} from "@/types/customer";
import type { CustomerOrder, DeliveryRating } from "@/types/order";

export const customerService = {
  lastDeliveryAddress: () =>
    api.get<LastDeliveryAddress | null>("/customers/me/last-delivery-address"),

  activeOrder: () => api.get<{ id: string } | null>("/customers/me/active-order"),

  updateProfile: (payload: UpdateCustomerProfilePayload) => api.patch("/users/me", payload),

  listBlockedDrivers: () => api.get<BlockedDriver[]>("/customers/me/blocked-drivers"),

  unblockDriver: (driverId: string) => api.delete(`/customers/me/blocked-drivers/${driverId}`),

  listOrders: (limit: number, offset: number) =>
    api.get<Paginated<CustomerOrder>>(`/customers/me/orders?limit=${limit}&offset=${offset}`),

  ratingsForOrders: (orderIds: string[]) =>
    api.post<Record<string, DeliveryRating>>("/customers/me/ratings", { orderIds }),

  driverMetricsForOrders: (orderIds: string[]) =>
    api.post<Record<string, DriverMetrics>>("/customers/me/driver-metrics", { orderIds }),
};
