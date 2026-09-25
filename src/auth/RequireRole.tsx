import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";
import { canAccessArea, homePathForRoles } from "@/auth/roles";
import type { AppRole } from "@/types/auth";

interface Props {
  role: AppRole;
  children: ReactNode;
}

/**
 * Renders `children` only for a logged-in user allowed in `role`'s area. Anyone else sees
 * a spinner while being redirected: to `/login` when logged out, or to their own home.
 */
export function RequireRole({ role, children }: Props) {
  const { isAuthenticated, isLoading, roles } = useAuth();
  const navigate = useNavigate();
  const allowed = isAuthenticated && canAccessArea(roles, role);

  useEffect(() => {
    if (isLoading || allowed) return;
    if (!isAuthenticated) navigate({ to: "/login", replace: true });
    else navigate({ to: homePathForRoles(roles), replace: true });
  }, [isLoading, allowed, isAuthenticated, roles, navigate]);

  if (isLoading || !allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
