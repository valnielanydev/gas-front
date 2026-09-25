import { api } from "@/integrations/api/client";

export type UpdateDriverProfilePayload = {
  phone: string | null;
  avatarUrl: string | null;
  notes: string | null;
  additionalInfo: string | null;
};

export type DriverSignupPayload = {
  token: string | null;
  password: string;
  fullName: string;
  phone: string;
  document: string;
  vehiclePlate: string;
  vehicleType: string;
  vehicleModel: string | null;
};

export const driverService = {
  updateLocation: (lat: number, lng: number) => api.patch("/drivers/me/location", { lat, lng }),

  updateStatus: (status: "offline" | "available" | "busy") =>
    api.patch("/drivers/me/status", { status }),

  dashboard: <T = unknown>() => api.get<T>("/drivers/me/dashboard"),

  startDelivery: <T = unknown>(orderId: string) => api.post<T>(`/orders/${orderId}/start-delivery`),

  me: <T>() => api.get<T>("/drivers/me"),

  myProfile: <T>() => api.get<T>("/drivers/me/profile"),

  updateMyProfile: (payload: UpdateDriverProfilePayload) =>
    api.patch("/drivers/me/profile", payload),

  activeOrder: <T>() => api.get<T | null>("/drivers/me/active-order"),

  pendingOrders: <T>() => api.get<T[]>("/drivers/me/pending-orders"),

  customerDetails: <T>(orderIds: string[]) =>
    api.post<T[]>("/drivers/me/customer-details", { orderIds }),

  deliveries: <T>(limit: number, offset: number) =>
    api.get<{ orders: T[]; hasMore: boolean }>(
      `/drivers/me/deliveries?limit=${limit}&offset=${offset}`,
    ),

  validateInvite: <T>(token: string) =>
    api.get<T>(`/invites/driver/validate?token=${encodeURIComponent(token)}`),

  signupWithInvite: (payload: DriverSignupPayload) => api.post("/invites/driver/signup", payload),
};
