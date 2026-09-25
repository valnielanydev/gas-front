import { api } from "@/integrations/api/client";
import type {
  AdminReseller,
  AdminUser,
  CreateResellerResponse,
  MasterStats,
  ResellerPayload,
} from "@/types/admin";
import type { AdminOrder } from "@/types/order";

export const adminService = {
  stats: () => api.get<MasterStats>("/admin/stats"),

  orders: (limit = 100) => api.get<AdminOrder[]>(`/admin/orders?limit=${limit}`),

  users: () => api.get<AdminUser[]>("/admin/users"),

  resellers: (params?: { active?: boolean }) =>
    api.get<AdminReseller[]>(`/admin/resellers${params?.active ? "?active=true" : ""}`),

  createReseller: (payload: ResellerPayload) =>
    api.post<CreateResellerResponse>("/admin/resellers", payload),

  updateReseller: (
    resellerId: string,
    payload: Partial<ResellerPayload> & { is_active?: boolean },
  ) => api.patch<null>(`/admin/resellers/${resellerId}`, payload),

  deleteReseller: (resellerId: string) => api.delete(`/admin/resellers/${resellerId}`),

  promoteToMaster: (userId: string) => api.post(`/admin/users/${userId}/roles`, { role: "master" }),

  demoteFromMaster: (userId: string) => api.delete(`/admin/users/${userId}/roles/master`),

  linkUserToReseller: (userId: string, resellerId: string, role: "reseller_admin" | "driver") =>
    api.post(`/admin/users/${userId}/reseller-link`, { resellerId, role }),
};
