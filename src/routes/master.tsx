import { createFileRoute, Outlet } from "@tanstack/react-router";
import { LayoutDashboard, Building2, Users, ShoppingCart } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";

export const Route = createFileRoute("/master")({
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
    <DashboardLayout title="Painel Master" navItems={navItems} requiredRole="master">
      <Outlet />
    </DashboardLayout>
  );
}
