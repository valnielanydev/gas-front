import { api } from "@/integrations/api/client";
import type {
  CreateOrderPayload,
  OrderDetailResponse,
  OrderRow,
  OrderTrackingResponse,
  RatingPayload,
  RatingResponse,
} from "@/types/order";

export const orderService = {
  create: (payload: CreateOrderPayload) => api.post<{ id: string }>("/orders", payload),

  accept: (orderId: string) => api.post<OrderRow>(`/orders/${orderId}/accept`),

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

  tracking: (orderId: string) => api.get<OrderTrackingResponse>(`/orders/${orderId}/tracking`),

  detail: (orderId: string) => api.get<OrderDetailResponse>(`/orders/${orderId}/detail`),

  rate: (orderId: string, payload: RatingPayload) =>
    api.post<RatingResponse>(`/orders/${orderId}/rating`, payload),
};
