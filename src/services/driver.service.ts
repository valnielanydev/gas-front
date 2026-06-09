import { api } from "@/integrations/api/client";

export const driverService = {
  updateLocation: (lat: number, lng: number) => api.patch("/drivers/me/location", { lat, lng }),

  updateStatus: (status: "offline" | "available" | "busy") =>
    api.patch("/drivers/me/status", { status }),

  dashboard: () => api.get<unknown>("/drivers/me/dashboard"),

  startDelivery: (orderId: string) => api.post<unknown>(`/orders/${orderId}/start-delivery`),
};
