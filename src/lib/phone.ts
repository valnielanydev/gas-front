import { onlyDigits } from "@/lib/utils";

export function formatPhone(v: string): string {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** Brazilian phone with area code: 10 (landline) or 11 (mobile) digits. */
export function isValidPhone(value: string): boolean {
  const d = onlyDigits(value);
  return d.length >= 10 && d.length <= 11;
}
