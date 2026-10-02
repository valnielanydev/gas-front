export type DriverApprovalStatus = "pending" | "active" | "inactive";
export type DriverOnlineStatus = "offline" | "available" | "busy";

export interface DriverRow {
  id: string;
  user_id: string;
  reseller_id: string;
  approval_status: DriverApprovalStatus;
  is_active: boolean;
  status: DriverOnlineStatus;
  current_latitude?: number | null;
  current_longitude?: number | null;
}

export interface DriverDashboardData {
  ordersToday: number;
  ordersWeek: number;
  ordersMonth: number;
  avgRating: number | null;
  acceptanceRate: number | null;
  cancellations: number;
}

export interface DriverProfile {
  fullName: string;
  phone: string;
  avatarUrl: string;
  notes: string;
  additionalInfo: string;
  approvalStatus: string;
  resellerName: string;
}

export interface CustomerDetails {
  customer_name: string | null;
}

export interface OrderCustomerDetails extends CustomerDetails {
  order_id: string;
}

/** Driver as listed by the reseller admin. */
export interface ResellerDriver {
  id: string;
  user_id: string;
  vehicle_plate: string | null;
  vehicle_model: string | null;
  vehicle_type: string | null;
  document: string | null;
  status: string;
  is_active: boolean;
  approval_status: DriverApprovalStatus;
  rating: number | null;
  total_deliveries: number;
  created_at: string;
  full_name: string | null;
  phone: string | null;
}

export interface DriverHistory {
  orders: Array<{ id: string; status: string; total_amount: number; created_at: string }>;
  ratings: Array<{ rating: number; comment: string | null }>;
}

export interface DriverInvite {
  token: string;
  expires_at: string;
}

export interface InviteReseller {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
}

export interface InviteValidation {
  valid: boolean;
  reseller: InviteReseller;
}

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

export type UpdateDriverPayload = {
  fullName: string;
  phone: string;
  document: string | null;
  vehiclePlate: string | null;
  vehicleType: string | null;
  vehicleModel: string | null;
};
