export interface MasterStats {
  resellers: number;
  orders: number;
  drivers: number;
  users: number;
}

export interface AdminUser {
  id: string;
  full_name: string | null;
  phone: string | null;
  roles: string[];
  reseller_id: string | null;
  reseller_name: string | null;
}

export interface AdminReseller {
  id: string;
  name: string;
  cnpj: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  state: string | null;
  service_radius_km: number;
  is_active: boolean;
  invite_code: string;
  postal_code?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export type ResellerPayload = {
  name: string;
  cnpj: string | null;
  phone: string;
  email: string | null;
  postalCode: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  serviceRadiusKm: number;
  adminFullName: string;
};

export type CreateResellerResponse = {
  loginEmail: string;
  password: string;
  inviteCode: string;
};
