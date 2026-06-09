import { api } from "@/integrations/api/client";

type LastDeliveryAddress = {
  delivery_address: string;
  delivery_latitude: number | null;
  delivery_longitude: number | null;
};

export const customerService = {
  lastDeliveryAddress: () =>
    api.get<LastDeliveryAddress | null>("/customers/me/last-delivery-address"),

  activeOrder: () => api.get<{ id: string } | null>("/customers/me/active-order"),
};
