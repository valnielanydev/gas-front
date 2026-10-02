import { api } from "@/integrations/api/client";
import type { LoginPayload, RegisterPayload, SessionData } from "@/types/auth";

export const authService = {
  login: (payload: LoginPayload) =>
    api.post<unknown>("/auth/login", payload, { expectsAuthFailure: true }),

  logout: () => api.post("/auth/logout"),

  /** Answers 401 when logged out, which is not an expired session. */
  me: () => api.get<SessionData>("/auth/me", { expectsAuthFailure: true }),

  checkCpf: (cpf: string) => api.post<{ exists: boolean }>("/auth/check-cpf", { cpf }),

  register: (payload: RegisterPayload) => api.post("/auth/register", payload),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.post(
      "/auth/change-password",
      { currentPassword, newPassword },
      { expectsAuthFailure: true },
    ),

  resetPassword: (token: string, password: string) =>
    api.post("/auth/reset-password", { token, password }),
};
