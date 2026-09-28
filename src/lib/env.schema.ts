import { z } from "zod";

/** Blank values in `.env` (e.g. `VITE_SENTRY_DSN=""`) mean "not set". */
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((v) => (v === "" ? undefined : v), schema.optional());

/**
 * Variables exposed to the browser. Kept free of `import.meta.env` so `vite.config.ts`
 * can check them too and fail the build when one is missing or malformed.
 */
export const clientEnvSchema = z.object({
  VITE_API_URL: z.url({ protocol: /^https?$/ }).transform((url) => url.replace(/\/+$/, "")),
  VITE_SENTRY_DSN: optional(z.url()),
  /** Public URL of this front-end; social previews (og:image) need absolute links. */
  VITE_SITE_URL: optional(
    z.url({ protocol: /^https?$/ }).transform((url) => url.replace(/\/+$/, "")),
  ),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;

export function parseClientEnv(source: Record<string, unknown>): ClientEnv {
  const result = clientEnvSchema.safeParse(source);
  if (!result.success) {
    throw new Error(`Variáveis de ambiente inválidas:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}
