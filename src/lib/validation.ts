import { z } from "zod";
import { isValidPhone } from "@/lib/phone";

const PHONE_MESSAGE = "Telefone inválido — informe DDD + número";

/** Required phone with area code. */
export const phoneSchema = z.string().refine(isValidPhone, PHONE_MESSAGE);

/** Phone with area code, or empty. */
export const optionalPhoneSchema = z
  .string()
  .refine((v) => !v.trim() || isValidPhone(v), PHONE_MESSAGE);
