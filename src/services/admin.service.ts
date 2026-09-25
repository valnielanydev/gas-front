import { api } from "@/integrations/api/client";

export type CreateResellerResponse = {
  loginEmail: string;
  password: string;
  inviteCode: string;
};

export const adminService = {
  stats: <T>() => api.get<T>("/admin/stats"),

  orders: <T>(limit = 100) => api.get<T[]>(`/admin/orders?limit=${limit}`),

  users: <T>() => api.get<T[]>("/admin/users"),

  resellers: <T>(params?: { active?: boolean }) =>
    api.get<T[]>(`/admin/resellers${params?.active ? "?active=true" : ""}`),

  createReseller: (payload: unknown) =>
    api.post<CreateResellerResponse>("/admin/resellers", payload),

  updateReseller: (resellerId: string, payload: unknown) =>
    api.patch<null>(`/admin/resellers/${resellerId}`, payload),

  deleteReseller: (resellerId: string) => api.delete(`/admin/resellers/${resellerId}`),

  promoteToMaster: (userId: string) => api.post(`/admin/users/${userId}/roles`, { role: "master" }),

  demoteFromMaster: (userId: string) => api.delete(`/admin/users/${userId}/roles/master`),

  linkUserToReseller: (userId: string, resellerId: string, role: "reseller_admin" | "driver") =>
    api.post(`/admin/users/${userId}/reseller-link`, { resellerId, role }),
};
