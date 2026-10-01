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

export type CustomerAddress = {
  _id: string;
  userId: string;
  label?: string;
  postalCode?: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood?: string;
  city: string;
  state: string;
  reference?: string;
  isDefault: boolean;
  location: GeoLocation;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateCustomerAddress = {
  street: string;
  postalCode: string;
  number: string;
  complement: string;
  state: string;
  neighborhood: string;
};

export type GeoLocation = {
  type: "Point";
  coordinates: [number, number];
};
