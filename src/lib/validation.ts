import { z } from "zod";
import { isValidCpf } from "@/lib/cpf";
import { isValidPhone } from "@/lib/phone";

const PHONE_MESSAGE = "Telefone inválido — informe DDD + número";

/** Required phone with area code. */
export const phoneSchema = z.string().refine(isValidPhone, PHONE_MESSAGE);

/** Phone with area code, or empty. */
export const optionalPhoneSchema = z
  .string()
  .refine((v) => !v.trim() || isValidPhone(v), PHONE_MESSAGE);

export const cpfSchema = z.string().refine(isValidCpf, "CPF inválido");

/** Old (ABC-1234) or Mercosul (ABC1D23) plate, uppercase. */
export const vehiclePlateSchema = z
  .string()
  .regex(/^[A-Z]{3}-?[0-9][0-9A-Z][0-9]{2}$/, "Placa inválida (ex: ABC-1234 ou ABC-1D23)");

/** Lets `schema` also accept an empty (or blank) string, for optional form fields. */
export const orEmpty = <T extends z.ZodType<string>>(schema: T) =>
  z.union([z.string().trim().length(0), schema]);

/** First error message of each field, for showing next to the inputs. */
export function fieldErrors<T extends Record<string, unknown>>(
  error: z.ZodError<T>,
): Partial<Record<keyof T, string>> {
  const errors: Partial<Record<keyof T, string>> = {};
  for (const issue of error.issues) {
    const field = issue.path[0] as keyof T;
    if (!errors[field]) errors[field] = issue.message;
  }
  return errors;
}
