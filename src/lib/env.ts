import { parseClientEnv } from "./env.schema";

/** Validated `VITE_*` variables; the build already failed if any is invalid. */
export const env = parseClientEnv(import.meta.env);
