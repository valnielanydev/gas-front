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

export const resellerService = {
  nearby: (lat: number, lng: number, radiusKm = 25) =>
    api.get<Reseller[]>(`/resellers/nearby?lat=${lat}&lng=${lng}&radius=${radiusKm}`),

  products: (resellerId: string) => api.get<Product[]>(`/resellers/${resellerId}/products`),

  orders: (resellerId: string) => api.get<unknown[]>(`/resellers/${resellerId}/orders`),
};
