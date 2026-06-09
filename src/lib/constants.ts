export function getApiBase(): string {
  return (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:3001";
}

export function fmtMoney(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function payLabel(pm: "cash" | "card" | "pix"): string {
  return pm === "cash" ? "Dinheiro" : pm === "pix" ? "Pix" : "Cartão";
}

export const SPEED_KMH = {
  driver: 30,
  resellerEstimate: 22,
  osrmFallback: 28,
  driverFallback: 25,
} as const;

/** Headers required by Nominatim's usage policy. User-Agent is effective in SSR; browsers send Referer automatically. */
export const NOMINATIM_HEADERS = {
  Accept: "application/json",
  "User-Agent": "VaptGas/1.0",
} as const;
