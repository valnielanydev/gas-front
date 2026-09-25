import { createFileRoute } from "@tanstack/react-router";
import { Package, Truck, ShoppingCart, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useResellerStats } from "@/queries/reseller.queries";
import { useAuth } from "@/auth/AuthProvider";

export const Route = createFileRoute("/app/")({
  component: AppOverview,
});

function AppOverview() {
  const { resellerId } = useAuth();

  const { data: stats } = useResellerStats(resellerId);

  if (!resellerId) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">
            Sua conta ainda não está vinculada a uma revendedora. Peça ao Master para fazer o
            vínculo.
          </p>
        </CardContent>
      </Card>
    );
  }

  const cards = [
    {
      label: "Pedidos pendentes",
      value: stats?.pending ?? "-",
      icon: ShoppingCart,
      color: "text-warning",
    },
    { label: "Pedidos totais", value: stats?.orders ?? "-", icon: Star, color: "text-primary" },
    { label: "Produtos", value: stats?.products ?? "-", icon: Package, color: "text-secondary" },
    { label: "Motoristas", value: stats?.drivers ?? "-", icon: Truck, color: "text-success" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Bem-vindo</h1>
        <p className="text-sm text-muted-foreground">Resumo da sua revendedora</p>
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
