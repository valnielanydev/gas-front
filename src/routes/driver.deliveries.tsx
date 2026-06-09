import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { api } from "@/integrations/api/client";
import { useAuth } from "@/auth/AuthProvider";
import { DriverLayout } from "@/components/DriverLayout";
import { getOrderStatusLabel } from "@/i18n/ptBR";

type DriverDeliveryRow = {
  id: string;
  status: string;
  delivery_address: string | null;
  total_amount: number | string | null;
  created_at: string;
};

interface DeliveriesResponse {
  orders: DriverDeliveryRow[];
  hasMore: boolean;
}

export const Route = createFileRoute("/driver/deliveries")({ component: DriverDeliveriesPage });

const PAGE_SIZE = 10;

function DriverDeliveriesPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<DriverDeliveryRow[] | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchOrders = async (nextOffset: number, append: boolean) => {
    const data = await api.get<DeliveriesResponse>(
      `/drivers/me/deliveries?limit=${PAGE_SIZE}&offset=${nextOffset}`,
    );
    const incoming = data.orders ?? [];
    setOrders((prev) => {
      if (!append || !prev) return incoming;
      const deduped = incoming.filter((row) => !prev.some((existing) => existing.id === row.id));
      return [...prev, ...deduped];
    });
    setOffset(nextOffset + incoming.length);
    setHasMore(data.hasMore ?? incoming.length === PAGE_SIZE);
  };

  useEffect(() => {
    if (!user) {
      setOrders(null);
      return;
    }
    setOrders(null);
    setOffset(0);
    setHasMore(true);
    fetchOrders(0, false).catch(() => setOrders([]));
  }, [user]);

  const canLoadMore = useMemo(() => !!orders?.length && hasMore, [orders, hasMore]);

  return (
    <DriverLayout>
      <h1 className="text-xl font-bold">Entregas</h1>
      {orders === null && (
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
            <div className="text-muted-foreground">R$ {Number(o.total_amount ?? 0).toFixed(2)}</div>
          </CardContent>
        </Card>
      ))}
      {canLoadMore && (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={isLoadingMore}
          onClick={async () => {
            setIsLoadingMore(true);
            await fetchOrders(offset, true).catch(() => {});
            setIsLoadingMore(false);
          }}
        >
          {isLoadingMore ? "Carregando..." : "Carregar mais pedidos"}
        </Button>
      )}
    </DriverLayout>
  );
}
