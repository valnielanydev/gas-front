export type PaymentMethod = "cash" | "card" | "pix";

export type DriverOrderStatus =
  | "pending"
  | "accepted"
  | "in_delivery"
  | "delivered"
  | "cancelled"
  | "cancelado_pelo_motorista";

export type CustomerOrderStatus = DriverOrderStatus | "cancelled_by_customer" | "expired";

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

export interface CustomerOrder {
  id: string;
  status: Exclude<CustomerOrderStatus, "expired">;
  delivery_address: string;
  total_amount: number;
  created_at: string;
  quantity: number;
  payment_method: PaymentMethod;
  reseller_id: string;
  product_id: string;
}

export interface ResellerOrder {
  id: string;
  created_at: string;
  status: string;
  delivery_address: string | null;
  total_amount: number;
  quantity: number;
  delivery_code: string | null;
  product?: { name: string } | null;
}

export interface AdminOrder {
  id: string;
  created_at: string;
  status: string;
  total_amount: number;
  quantity: number;
  reseller?: { name: string } | null;
  product?: { name: string } | null;
}

export interface DriverDelivery {
  id: string;
  status: string;
  delivery_address: string | null;
  total_amount: number | string | null;
  created_at: string;
}

export type DeliveryRating = {
  rating: number;
  comment: string | null;
  delivery_time_rating?: number | null;
};

export type EvaluatorRole = "customer" | "driver";

export type RatingResponse = DeliveryRating & { evaluator_role?: EvaluatorRole };

export interface OrderDetailResponse {
  resellerName: string | null;
  productName: string | null;
  rating: DeliveryRating | null;
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

export interface OrderTrackingResponse {
  order: FullOrder;
  reseller: TrackingReseller | null;
  driver: TrackingDriver | null;
  product: TrackingProduct | null;
  customerRating: DeliveryRating | null;
}

export type CreateOrderPayload = {
  resellerId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  deliveryAddress: string;
  deliveryReference: string | null;
  deliveryLatitude: number | null;
  deliveryLongitude: number | null;
  paymentMethod: PaymentMethod;
  needsChange: boolean;
  changeFor: number | null;
  customerIdentificationType: "nome" | "anonimo";
  receiverName: string;
};

export type RatingPayload = {
  rating: number;
  comment: string;
  delivery_time_rating: number | null;
};
