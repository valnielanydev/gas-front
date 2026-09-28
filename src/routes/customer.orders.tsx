import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Loader2, Package, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import {
  useCustomerOrders,
  useCustomerRatings,
  useDriverMetricsForOrders,
  useOrderDetail,
} from "@/queries/customer.queries";
import { useAuth } from "@/auth/AuthProvider";
import { fmtMoney } from "@/lib/constants";
import { RatingCard } from "@/components/rating/RatingCard";
import { LoadError } from "@/components/common/LoadError";
import type { CustomerOrder } from "@/types/order";
import { getOrderStatusLabel, getPaymentMethodLabel, isOrderActive } from "@/lib/order-status";

export const Route = createFileRoute("/customer/orders")({
  component: MyOrders,
});

function MyOrders() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    items: rows,
    hasMore,
    loadMore,
    isLoadingMore,
    isError,
    retry,
    isRetrying,
  } = useCustomerOrders(user?.id);

  const orderIds = useMemo(() => rows?.map((o) => o.id) ?? [], [rows]);
  const deliveredIds = useMemo(
    () => rows?.filter((o) => o.status === "delivered").map((o) => o.id) ?? [],
    [rows],
  );
  const { data: ratingsByOrder = {} } = useCustomerRatings(user?.id, deliveredIds);
  const { data: driverMetricsByOrder = {} } = useDriverMetricsForOrders(user?.id, orderIds);

  const [clickedOrder, setClickedOrder] = useState<CustomerOrder | null>(null);
  const detail = useOrderDetail(clickedOrder?.id ?? null);
  const loadingOrderDetails = !!clickedOrder && detail.isPending;
  // On a failed detail request the drawer still opens, with what the list already knows
  const selectedOrder =
    clickedOrder && !loadingOrderDetails
      ? {
          order: clickedOrder,
          productName: detail.data?.productName ?? null,
          resellerName: detail.data?.resellerName ?? null,
          rating: detail.data?.rating ?? ratingsByOrder[clickedOrder.id] ?? null,
        }
      : null;
  const closeDetails = () => setClickedOrder(null);

  const handleOrderClick = (order: CustomerOrder) => {
    if (isOrderActive(order.status)) {
      navigate({ to: "/customer/order/$orderId", params: { orderId: order.id } });
      return;
    }
    setClickedOrder(order);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-3 p-4 pb-24">
      <h1 className="text-lg font-bold">Meus pedidos</h1>

      {isError && (
        <LoadError
          message="Não foi possível carregar seus pedidos."
          onRetry={retry}
          retrying={isRetrying}
        />
      )}
      {rows === null && !isError && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}
      {rows && rows.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Você ainda não fez pedidos.
          </CardContent>
        </Card>
      )}
      {rows?.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => handleOrderClick(o)}
          className="block w-full text-left"
        >
          <Card className="w-full max-w-full overflow-hidden transition active:scale-[0.99] hover:border-primary">
            <CardContent className="flex min-h-36 items-start gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Package className="h-5 w-5" />
              </div>
              <div className="flex min-h-28 min-w-0 flex-1 flex-col justify-between break-words">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{fmtMoney(o.total_amount)}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {getOrderStatusLabel(o.status)}
                    </Badge>
                  </div>
                  <div className="truncate text-xs text-muted-foreground">{o.delivery_address}</div>
                </div>
                <div className="space-y-1">
                  <div className="h-4 text-xs text-muted-foreground">
                    ⭐ {driverMetricsByOrder[o.id]?.rating?.toFixed(1) ?? "—"} • ⏱️{" "}
                    {driverMetricsByOrder[o.id]?.delivery_time_rating?.toFixed(1) ?? "—"}
                  </div>
                  <div className="h-4 text-xs text-muted-foreground">
                    {o.status === "delivered" ? (
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 text-amber-500" />
                        {ratingsByOrder[o.id]
                          ? `Sua nota: ${ratingsByOrder[o.id].rating}/5`
                          : "Você ainda não avaliou"}
                      </span>
                    ) : (
                      <span className="opacity-0">placeholder</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </button>
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

      <Drawer
        snapPoints={[0.5, 0.88]}
        open={loadingOrderDetails || !!selectedOrder}
        onOpenChange={(open) => !open && closeDetails()}
      >
        <DrawerContent className="max-h-[88dvh]">
          <DrawerHeader className="text-left">
            <DrawerTitle>Detalhes do pedido</DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 pb-6">
            {loadingOrderDetails && (
              <div className="flex justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            )}
            {selectedOrder && (
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Produto:</strong> {selectedOrder.productName ?? "—"}
                </p>
                <p>
                  <strong>Quantidade:</strong> {selectedOrder.order.quantity}
                </p>
                <p>
                  <strong>Valor total:</strong> {fmtMoney(selectedOrder.order.total_amount)}
                </p>
                <p>
                  <strong>Endereço completo:</strong> {selectedOrder.order.delivery_address}
                </p>
                <p>
                  <strong>Forma de pagamento:</strong>{" "}
                  {getPaymentMethodLabel(selectedOrder.order.payment_method)}
                </p>
                <p>
                  <strong>Revendedora:</strong> {selectedOrder.resellerName ?? "—"}
                </p>
                <p>
                  <strong>Data/hora:</strong>{" "}
                  {new Date(selectedOrder.order.created_at).toLocaleString("pt-BR")}
                </p>
                <p>
                  <strong>Avaliação:</strong>{" "}
                  {selectedOrder.rating
                    ? `${selectedOrder.rating.rating}/5${selectedOrder.rating.comment ? ` — ${selectedOrder.rating.comment}` : ""}`
                    : "Sem avaliação"}
                </p>
                {selectedOrder.order.status === "delivered" && (
                  <div className="pt-2" onClick={(e) => e.preventDefault()}>
                    <RatingCard
                      orderId={selectedOrder.order.id}
                      existingRating={selectedOrder.rating}
                      expectedEvaluatorRole="customer"
                      allowEdit
                      title="Editar avaliação"
                    />
                  </div>
                )}
                <Button
                  type="button"
                  variant="secondary"
                  className="mt-2 w-full"
                  onClick={closeDetails}
                >
                  Fechar
                </Button>
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
