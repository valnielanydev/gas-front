import { createFileRoute, Outlet } from "@tanstack/react-router";
import { LayoutDashboard, Package, Truck, ShoppingCart } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";

export const Route = createFileRoute("/app")({
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
    <DashboardLayout title="Revendedora" navItems={navItems} requiredRole="reseller_admin">
      <Outlet />
    </DashboardLayout>
  );
}
