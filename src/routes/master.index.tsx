import { createFileRoute } from "@tanstack/react-router";
import { Building2, Users, ShoppingCart, Truck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMasterStats } from "@/queries/admin.queries";

export const Route = createFileRoute("/master/")({
  component: MasterOverview,
});

function MasterOverview() {
  const { data: stats } = useMasterStats();

  const cards = [
    {
      label: "Revendedoras",
      value: stats?.resellers ?? "-",
      icon: Building2,
      color: "text-primary",
    },
    { label: "Pedidos", value: stats?.orders ?? "-", icon: ShoppingCart, color: "text-secondary" },
    { label: "Motoristas", value: stats?.drivers ?? "-", icon: Truck, color: "text-success" },
    { label: "Usuários", value: stats?.users ?? "-", icon: Users, color: "text-warning" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Visão Geral</h1>
        <p className="text-sm text-muted-foreground">Métricas globais da plataforma</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
              <c.icon className={`h-5 w-5 ${c.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{c.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
