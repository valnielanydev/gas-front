export type PaymentMethod = "cash" | "card" | "pix";

export type DriverOrderStatus =
  | "pending"
  | "accepted"
  | "in_delivery"
  | "delivered"
  | "cancelled"
  | "cancelado_pelo_motorista";

export type CustomerOrderStatus = DriverOrderStatus | "cancelled_by_customer" | "expired";

export type DriverApprovalStatus = "pending" | "active" | "inactive";
export type DriverOnlineStatus = "offline" | "available" | "busy";

export interface OrderRow {
  id: string;
  status: DriverOrderStatus;
  delivery_address: string;
  delivery_reference: string | null;
  delivery_code: string;
  total_amount: number;
  unit_price: number;
  quantity: number;
  payment_method: PaymentMethod;
  needs_change: boolean | null;
  change_for: number | null;
  notes: string | null;
  driver_id: string | null;
  reseller_id: string;
  created_at: string;
  accepted_at: string | null;
  customer_id: string;
  customer_latitude: number | null;
  customer_longitude: number | null;
}

export interface DriverDashboardData {
  ordersToday: number;
  ordersWeek: number;
  ordersMonth: number;
  avgRating: number | null;
  acceptanceRate: number | null;
  cancellations: number;
}

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

export interface FullOrder {
  id: string;
  status: CustomerOrderStatus;
  delivery_address: string;
  delivery_reference: string | null;
  delivery_code: string;
  total_amount: number;
  unit_price: number;
  quantity: number;
  payment_method: PaymentMethod;
  needs_change: boolean | null;
  change_for: number | null;
  reseller_id: string;
  driver_id: string | null;
  product_id: string;
  created_at: string;
  accepted_at: string | null;
  delivered_at: string | null;
  customer_latitude: number | null;
  customer_longitude: number | null;
}

export interface TrackingReseller {
  id: string;
  name: string;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface TrackingDriver {
  id: string;
  name: string | null;
  vehicle_model: string | null;
  vehicle_plate: string | null;
  rating: number | null;
  delivery_time_rating: number | null;
  current_latitude: number | null;
  current_longitude: number | null;
}

export interface TrackingProduct {
  id: string;
  name: string;
}

export interface CustomerDetails {
  customer_name: string | null;
}

export interface Coords {
  lat: number;
  lng: number;
}
