import { createFileRoute, Outlet } from "@tanstack/react-router";
import { RequireRole } from "@/auth/RequireRole";
import { CustomerBottomNav } from "@/components/layout/CustomerBottomNav";

export const Route = createFileRoute("/customer")({
  component: CustomerLayout,
});

function CustomerLayout() {
  return (
    <RequireRole role="customer">
      <div className="min-h-screen bg-background">
        <Outlet />
        <CustomerBottomNav />
      </div>
    </RequireRole>
  );
}
