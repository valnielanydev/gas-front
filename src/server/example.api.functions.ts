// Exemplo de como chamar a API Node externa dentro de uma server function.
// Delete este arquivo quando não precisar mais de referência.

import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { apiClient, ApiError } from "@/integrations/api/client.server";

// --- Exemplo: GET sem autenticação ---
export const getPublicData = createServerFn({ method: "GET" }).handler(async () => {
  const data = await apiClient.get<{ items: string[] }>("/items");
  return data;
});

// --- Exemplo: POST com token do usuário logado ---
const createOrderSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
});

export const createOrderOnApi = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => createOrderSchema.parse(input))
  .handler(async ({ data }) => {
    const accessToken = getRequest().headers.get("authorization")?.replace("Bearer ", "");

    try {
      const result = await apiClient.post<{ orderId: string }>("/orders", data, { accessToken });
      return result;
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        throw new Error("Pedido duplicado.");
      }
      throw err;
    }
  });
