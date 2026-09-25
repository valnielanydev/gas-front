import type { AppRole } from "@/types/auth";

const STAFF_ROLES: AppRole[] = ["master", "reseller_admin", "driver"];

/** Landing page for a logged-in user, by their most privileged role. */
export function homePathForRoles(roles: AppRole[]): "/master" | "/app" | "/driver" | "/customer" {
  if (roles.includes("master")) return "/master";
  if (roles.includes("reseller_admin")) return "/app";
  if (roles.includes("driver")) return "/driver";
  return "/customer";
}

/**
 * Whether `roles` may enter the area of `role`. The customer area is also open to users
 * without any role, so a plain sign-up lands there; staff-only users are kept out of it.
 */
export function canAccessArea(roles: AppRole[], role: AppRole): boolean {
  if (role === "customer") {
    return roles.includes("customer") || !roles.some((r) => STAFF_ROLES.includes(r));
  }
  return roles.includes(role);
}
