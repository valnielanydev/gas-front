import { queryOptions } from "@tanstack/react-query";
import { ApiError } from "@/integrations/api/client";
import { authService } from "@/services/auth.service";
import type { SessionData } from "@/types/auth";

export const sessionKey = ["auth", "session"] as const;

/**
 * The logged-in user's session, or `null` when logged out. Shared by the route guards
 * (`beforeLoad`) and `AuthProvider`, so both read the same cached `/auth/me` answer.
 */
export const sessionQueryOptions = queryOptions({
  queryKey: sessionKey,
  queryFn: async (): Promise<SessionData | null> => {
    try {
      return await authService.me();
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return null;
      throw e;
    }
  },
  // Changes only through sign-in, sign-out, `refresh()` or a 401
  staleTime: Infinity,
});
