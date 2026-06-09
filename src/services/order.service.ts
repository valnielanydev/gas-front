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

export const orderService = {
  create: (payload: CreateOrderPayload) => api.post<{ id: string }>("/orders", payload),

  accept: (orderId: string) => api.post<unknown>(`/orders/${orderId}/accept`),

  updateStatus: (orderId: string, status: string) =>
    api.patch(`/orders/${orderId}/status`, { status }),

  deliver: (orderId: string, code: string) =>
    api.post<unknown>(`/orders/${orderId}/deliver`, { code }),

  cancel: (orderId: string, reason: string) =>
    api.post<unknown>(`/orders/${orderId}/cancel`, { reason }),
};
