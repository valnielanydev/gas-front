import { env } from "./env";

export function getApiBase(): string {
  return env.VITE_API_URL;
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
