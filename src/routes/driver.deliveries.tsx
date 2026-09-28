import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useDriverDeliveries } from "@/queries/driver.queries";
import { LoadError } from "@/components/common/LoadError";
import { fmtMoney } from "@/lib/constants";
import { useAuth } from "@/auth/AuthProvider";
import { DriverLayout } from "@/components/layout/DriverLayout";
import { getOrderStatusLabel } from "@/lib/order-status";

export const Route = createFileRoute("/driver/deliveries")({ component: DriverDeliveriesPage });

function DriverDeliveriesPage() {
  const { user } = useAuth();
  const {
    items: orders,
    hasMore,
    loadMore,
    isLoadingMore,
    isError,
    retry,
    isRetrying,
  } = useDriverDeliveries(user?.id);

  return (
    <DriverLayout>
      <h1 className="text-xl font-bold">Entregas</h1>
      {isError && (
        <LoadError
          message="Não foi possível carregar suas entregas."
          onRetry={retry}
          retrying={isRetrying}
        />
      )}
      {orders === null && !isError && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}
      {orders && orders.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Você ainda não tem entregas.
          </CardContent>
        </Card>
      )}
      {orders?.map((o) => (
        <Card key={o.id}>
          <CardHeader>
            <CardTitle className="flex justify-between text-sm">
              Pedido #{String(o.id ?? "").slice(0, 8)}
              <Badge>{getOrderStatusLabel(o.status)}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {o.delivery_address ?? "Endereço não informado"}
            <div className="text-muted-foreground">{fmtMoney(Number(o.total_amount ?? 0))}</div>
          </CardContent>
        </Card>
      ))}
      {hasMore && (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={isLoadingMore}
          onClick={loadMore}
        >
          {isLoadingMore ? "Carregando..." : "Carregar mais pedidos"}
        </Button>
      )}
    </DriverLayout>
  );
}
