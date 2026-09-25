export function getApiBase(): string {
  return (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:3001";
}

export function fmtMoney(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export const SPEED_KMH = {
  driver: 30,
  resellerEstimate: 22,
  osrmFallback: 28,
  driverFallback: 25,
} as const;
