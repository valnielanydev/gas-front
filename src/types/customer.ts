export type LastDeliveryAddress = {
  delivery_address: string;
  delivery_latitude: number | null;
  delivery_longitude: number | null;
};

export type BlockedDriver = {
  driver_id: string;
  driver_name: string | null;
  blocked_at: string;
};

export type DriverMetrics = {
  rating: number | null;
  delivery_time_rating: number | null;
};

export type UpdateCustomerProfilePayload = {
  name: string | null;
  phone: string | null;
};
