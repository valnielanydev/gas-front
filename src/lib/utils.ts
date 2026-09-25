import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Strips everything but digits (masks, spaces, punctuation). */
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}
