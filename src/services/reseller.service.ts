import { api } from "@/integrations/api/client";
import type {
  DriverApprovalStatus,
  DriverHistory,
  DriverInvite,
  ResellerDriver,
  UpdateDriverPayload,
} from "@/types/driver";
import type { ResellerOrder } from "@/types/order";
import type {
  NearbyReseller,
  Product,
  ResellerStats,
  UpsertProductPayload,
} from "@/types/reseller";

export const resellerService = {
  nearby: (lat: number, lng: number, radiusKm = 25) =>
    api.get<NearbyReseller[]>(`/resellers/nearby?lat=${lat}&lng=${lng}&radius=${radiusKm}`),

  products: (resellerId: string) => api.get<Product[]>(`/resellers/${resellerId}/products`),

  orders: (resellerId: string) => api.get<ResellerOrder[]>(`/resellers/${resellerId}/orders`),

  stats: (resellerId: string) => api.get<ResellerStats>(`/resellers/${resellerId}/stats`),

  createProduct: (resellerId: string, payload: UpsertProductPayload) =>
    api.post(`/resellers/${resellerId}/products`, payload),

  updateProduct: (productId: string, payload: UpsertProductPayload) =>
    api.patch(`/products/${productId}`, payload),

  deleteProduct: (productId: string) => api.delete(`/products/${productId}`),

  drivers: (resellerId: string) => api.get<ResellerDriver[]>(`/resellers/${resellerId}/drivers`),

  updateDriverStatus: (driverId: string, approvalStatus: DriverApprovalStatus) =>
    api.patch(`/drivers/${driverId}/status`, { approvalStatus }),

  updateDriver: (driverId: string, payload: UpdateDriverPayload) =>
    api.patch(`/drivers/${driverId}`, payload),

  removeDriver: (driverId: string, deleteAccount: boolean) =>
    api.delete(`/drivers/${driverId}?deleteAccount=${deleteAccount}`),

  driverHistory: (driverId: string) => api.get<DriverHistory>(`/drivers/${driverId}/history`),

  generateDriverInvite: () => api.post<DriverInvite>("/invites/driver"),
};
