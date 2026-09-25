import { api } from "@/integrations/api/client";
import type { LoginPayload, RegisterPayload, SessionData } from "@/types/auth";

export const authService = {
  login: (payload: LoginPayload) => api.post<unknown>("/auth/login", payload),

  logout: () => api.post("/auth/logout"),

  me: () => api.get<SessionData>("/auth/me"),

  checkCpf: (cpf: string) => api.post<{ exists: boolean }>("/auth/check-cpf", { cpf }),

  register: (payload: RegisterPayload) => api.post("/auth/register", payload),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.post("/auth/change-password", { currentPassword, newPassword }),

  resetPassword: (token: string, password: string) =>
    api.post("/auth/reset-password", { token, password }),
};
