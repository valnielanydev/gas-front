import { createFileRoute, Outlet } from "@tanstack/react-router";
import { LayoutDashboard, Building2, Users, ShoppingCart } from "lucide-react";
import { requireRole } from "@/auth/guard";
import { FullScreenLoader } from "@/components/common/FullScreenLoader";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export const Route = createFileRoute("/master")({
  // Auth lives in the API's cookie, which the SSR server can't see: guard in the browser
  ssr: false,
  beforeLoad: requireRole("master"),
  // Rendered by SSR and while the guard checks the session
  pendingComponent: FullScreenLoader,
  component: MasterLayout,
});

const navItems = [
  { to: "/master", label: "Visão Geral", icon: LayoutDashboard },
  { to: "/master/resellers", label: "Revendedoras", icon: Building2 },
  { to: "/master/users", label: "Usuários", icon: Users },
  { to: "/master/orders", label: "Pedidos", icon: ShoppingCart },
];

function MasterLayout() {
  return (
    <DashboardLayout title="Painel Master" navItems={navItems}>
      <Outlet />
    </DashboardLayout>
  );
}
