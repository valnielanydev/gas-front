import { api } from "@/integrations/api/client";
import type { Paginated } from "@/types/common";
import type {
  DriverDashboardData,
  DriverOnlineStatus,
  DriverProfile,
  DriverRow,
  DriverSignupPayload,
  InviteValidation,
  OrderCustomerDetails,
  UpdateDriverProfilePayload,
} from "@/types/driver";
import type { DriverDelivery, OrderRow } from "@/types/order";

export const driverService = {
  updateLocation: (lat: number, lng: number) => api.patch("/drivers/me/location", { lat, lng }),

  updateStatus: (status: DriverOnlineStatus) => api.patch("/drivers/me/status", { status }),

  dashboard: () => api.get<DriverDashboardData>("/drivers/me/dashboard"),

  startDelivery: (orderId: string) => api.post<OrderRow>(`/orders/${orderId}/start-delivery`),

  me: () => api.get<DriverRow>("/drivers/me"),

  myProfile: () => api.get<DriverProfile>("/drivers/me/profile"),

  updateMyProfile: (payload: UpdateDriverProfilePayload) =>
    api.patch("/drivers/me/profile", payload),

  activeOrder: () => api.get<OrderRow | null>("/drivers/me/active-order"),

  pendingOrders: () => api.get<OrderRow[]>("/drivers/me/pending-orders"),

  customerDetails: (orderIds: string[]) =>
    api.post<OrderCustomerDetails[]>("/drivers/me/customer-details", { orderIds }),

  deliveries: (limit: number, offset: number) =>
    api.get<Paginated<DriverDelivery>>(`/drivers/me/deliveries?limit=${limit}&offset=${offset}`),

  validateInvite: (token: string) =>
    api.get<InviteValidation>(`/invites/driver/validate?token=${encodeURIComponent(token)}`),

  signupWithInvite: (payload: DriverSignupPayload) => api.post("/invites/driver/signup", payload),
};
