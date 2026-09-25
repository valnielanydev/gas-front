export type AppRole = "master" | "reseller_admin" | "driver" | "customer";

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  cpf?: string;
  phone?: string;
  address?: string | null;
}

export interface SessionData {
  user: UserProfile;
  roles: AppRole[];
  resellerId?: string | null;
}

export type LoginPayload =
  | { cpf: string; password: string }
  | { identifier: string; password: string };

export interface RegisterPayload {
  cpf: string;
  name: string;
  email: string;
  phone?: string;
  password: string;
}
