import { api } from "@/integrations/api/client";

export interface RegisterPayload {
  cpf: string;
  name: string;
  email: string;
  phone?: string;
  password: string;
}

export const authService = {
  checkCpf: (cpf: string) => api.post<{ exists: boolean }>("/auth/check-cpf", { cpf }),

  register: (payload: RegisterPayload) => api.post("/auth/register", payload),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.post("/auth/change-password", { currentPassword, newPassword }),
};
