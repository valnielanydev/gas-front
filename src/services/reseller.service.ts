import { api } from "@/integrations/api/client";

export type Reseller = {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  distance_km: number | string;
  min_price: number | null;
};

export type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  is_available: boolean;
};

export type UpsertProductPayload = {
  name: string;
  description: string | null;
  price: number;
  is_available: boolean;
};

export type UpdateDriverPayload = {
  fullName: string;
  phone: string;
  document: string | null;
  vehiclePlate: string | null;
  vehicleType: string | null;
  vehicleModel: string | null;
};

export const resellerService = {
  nearby: (lat: number, lng: number, radiusKm = 25) =>
    api.get<Reseller[]>(`/resellers/nearby?lat=${lat}&lng=${lng}&radius=${radiusKm}`),

  products: (resellerId: string) => api.get<Product[]>(`/resellers/${resellerId}/products`),

  orders: <T = unknown>(resellerId: string) => api.get<T[]>(`/resellers/${resellerId}/orders`),

  stats: <T>(resellerId: string) => api.get<T>(`/resellers/${resellerId}/stats`),

  createProduct: (resellerId: string, payload: UpsertProductPayload) =>
    api.post(`/resellers/${resellerId}/products`, payload),

  updateProduct: (productId: string, payload: UpsertProductPayload) =>
    api.patch(`/products/${productId}`, payload),

  deleteProduct: (productId: string) => api.delete(`/products/${productId}`),

  drivers: <T>(resellerId: string) => api.get<T[]>(`/resellers/${resellerId}/drivers`),

  updateDriverStatus: (driverId: string, approvalStatus: string) =>
    api.patch(`/drivers/${driverId}/status`, { approvalStatus }),

  updateDriver: (driverId: string, payload: UpdateDriverPayload) =>
    api.patch(`/drivers/${driverId}`, payload),

  removeDriver: (driverId: string, deleteAccount: boolean) =>
    api.delete(`/drivers/${driverId}?deleteAccount=${deleteAccount}`),

  driverHistory: <T>(driverId: string) => api.get<T>(`/drivers/${driverId}/history`),

  generateDriverInvite: () => api.post<{ token: string; expires_at: string }>("/invites/driver"),
};
