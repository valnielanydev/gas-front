import { createFileRoute, Outlet } from "@tanstack/react-router";
import { LayoutDashboard, Package, Truck, ShoppingCart } from "lucide-react";
import { requireRole } from "@/auth/guard";
import { FullScreenLoader } from "@/components/common/FullScreenLoader";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export const Route = createFileRoute("/app")({
  // Auth lives in the API's cookie, which the SSR server can't see: guard in the browser
  ssr: false,
  beforeLoad: requireRole("reseller_admin"),
  // Rendered by SSR and while the guard checks the session
  pendingComponent: FullScreenLoader,
  component: AppLayout,
});

const navItems = [
  { to: "/app", label: "Início", icon: LayoutDashboard },
  { to: "/app/orders", label: "Pedidos", icon: ShoppingCart },
  { to: "/app/products", label: "Produtos", icon: Package },
  { to: "/app/drivers", label: "Motoristas", icon: Truck },
];

function AppLayout() {
  return (
    <DashboardLayout title="Revendedora" navItems={navItems}>
      <Outlet />
    </DashboardLayout>
  );
}
