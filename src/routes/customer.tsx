import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";
import { CustomerBottomNav } from "@/components/layout/CustomerBottomNav";

export const Route = createFileRoute("/customer")({
  component: CustomerLayout,
});

function CustomerLayout() {
  const { isAuthenticated, isLoading, hasRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      navigate({ to: "/login", replace: true });
    } else if (
      !hasRole("customer") &&
      (hasRole("master") || hasRole("reseller_admin") || hasRole("driver"))
    ) {
      // Staff users shouldn't land here
      if (hasRole("master")) navigate({ to: "/master", replace: true });
      else if (hasRole("reseller_admin")) navigate({ to: "/app", replace: true });
      else navigate({ to: "/driver", replace: true });
    }
  }, [isAuthenticated, isLoading, hasRole, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Outlet />
      <CustomerBottomNav />
    </div>
  );
}
