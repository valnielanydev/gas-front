export type NearbyReseller = {
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

export interface ResellerStats {
  products: number;
  drivers: number;
  orders: number;
  pending: number;
}
