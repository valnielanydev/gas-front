import { api } from "@/integrations/api/client";

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
  paymentMethod: "cash" | "card" | "pix";
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

export const orderService = {
  create: (payload: CreateOrderPayload) => api.post<{ id: string }>("/orders", payload),

  accept: <T = unknown>(orderId: string) => api.post<T>(`/orders/${orderId}/accept`),

  updateStatus: (orderId: string, status: string) =>
    api.patch(`/orders/${orderId}/status`, { status }),

  deliver: (orderId: string, code: string) =>
    api.post<unknown>(`/orders/${orderId}/deliver`, { code }),

  complete: (orderId: string, code: string) =>
    api.post<unknown>(`/orders/${orderId}/complete`, { code }),

  cancel: (orderId: string, reason?: string) =>
    api.post<unknown>(`/orders/${orderId}/cancel`, reason !== undefined ? { reason } : undefined),

  cancelByDriver: (orderId: string) => api.post<unknown>(`/orders/${orderId}/cancel-by-driver`),

  rejectDriver: (orderId: string, reason: string) =>
    api.post<unknown>(`/orders/${orderId}/reject-driver`, { reason }),

  tracking: <T>(orderId: string) => api.get<T>(`/orders/${orderId}/tracking`),

  detail: <T>(orderId: string) => api.get<T>(`/orders/${orderId}/detail`),

  rate: <T>(orderId: string, payload: RatingPayload) =>
    api.post<T>(`/orders/${orderId}/rating`, payload),
};
