import { redirect } from "@tanstack/react-router";
import type { RouterContext } from "@/router-context";
import type { AppRole } from "@/types/auth";
import { canAccessArea, homePathForRoles } from "./roles";
import { sessionQueryOptions } from "./session";

/**
 * `beforeLoad` for a role area: sends logged-out users to `/login` and users of another
 * role to their own home, before any of the area's routes load or render.
 *
 * Areas using it must set `ssr: false`: the session cookie belongs to the API origin, so
 * the server rendering the page can't tell who is logged in.
 */
export function requireRole(role: AppRole) {
  return async ({ context }: { context: RouterContext }) => {
    const session = await context.queryClient.ensureQueryData(sessionQueryOptions);
    if (!session) throw redirect({ to: "/login", replace: true });
    if (!canAccessArea(session.roles, role)) {
      throw redirect({ to: homePathForRoles(session.roles), replace: true });
    }
  };
}
