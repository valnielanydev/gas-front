import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Package, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { customerService } from "@/services/customer.service";
import { orderService } from "@/services/order.service";
import { useAuth } from "@/auth/AuthProvider";
import { fmtMoney } from "@/lib/constants";
import { RatingCard, type DeliveryRating } from "@/components/rating/RatingCard";
import { getOrderStatusLabel } from "@/i18n/ptBR";

export const Route = createFileRoute("/customer/orders")({
  component: MyOrders,
});

type Row = {
  id: string;
  status:
    | "pending"
    | "accepted"
    | "in_delivery"
    | "delivered"
    | "cancelled"
    | "cancelado_pelo_motorista"
    | "cancelled_by_customer";
  delivery_address: string;
  total_amount: number;
  created_at: string;
  quantity: number;
  payment_method: "cash" | "card" | "pix";
  reseller_id: string;
  product_id: string;
};

type OrderDetails = {
  order: Row;
  resellerName: string | null;
  productName: string | null;
  rating: DeliveryRating | null;
};

interface OrdersResponse {
  orders: Row[];
  hasMore: boolean;
}

interface OrderDetailResponse {
  resellerName: string | null;
  productName: string | null;
  rating: DeliveryRating | null;
}

const PAGE_SIZE = 10;
const TRACKING_STATUSES = new Set<Row["status"]>(["pending", "accepted", "in_delivery"]);
const STATUS_LABEL: Record<Row["status"], string> = {
  pending: getOrderStatusLabel("pending"),
  accepted: getOrderStatusLabel("accepted"),
  in_delivery: getOrderStatusLabel("in_delivery"),
  delivered: getOrderStatusLabel("delivered"),
  cancelled: getOrderStatusLabel("cancelled"),
  cancelado_pelo_motorista: getOrderStatusLabel("cancelado_pelo_motorista"),
  cancelled_by_customer: getOrderStatusLabel("cancelled_by_customer"),
};
const PAYMENT_LABEL: Record<Row["payment_method"], string> = {
  cash: "Dinheiro",
  card: "Cartão",
  pix: "Pix",
};

function MyOrders() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [ratingsByOrder, setRatingsByOrder] = useState<Record<string, DeliveryRating>>({});
  const [driverMetricsByOrder, setDriverMetricsByOrder] = useState<
    Record<string, { rating: number | null; delivery_time_rating: number | null }>
  >({});
  const [selectedOrder, setSelectedOrder] = useState<OrderDetails | null>(null);
  const [loadingOrderDetails, setLoadingOrderDetails] = useState(false);

  const fetchOrders = async (nextOffset: number, append: boolean) => {
    if (!user) return;
    const data: OrdersResponse = await customerService.listOrders<Row>(PAGE_SIZE, nextOffset);
    const incoming = data.orders ?? [];
    setRows((prev) => {
      if (!append || !prev) return incoming;
      const deduped = incoming.filter((row) => !prev.some((existing) => existing.id === row.id));
      return [...prev, ...deduped];
    });
    setOffset(nextOffset + incoming.length);
    setHasMore(data.hasMore ?? incoming.length === PAGE_SIZE);
  };

  useEffect(() => {
    if (!user) return;
    setRows(null);
    setOffset(0);
    setHasMore(true);
    fetchOrders(0, false).catch(() => setRows([]));
  }, [user]);

  useEffect(() => {
    if (!rows?.length) return;
    const deliveredIds = rows.filter((o) => o.status === "delivered").map((o) => o.id);
    if (!deliveredIds.length) return;
    customerService
      .ratingsForOrders<DeliveryRating>(deliveredIds)
      .then((mapped) => setRatingsByOrder((prev) => ({ ...prev, ...mapped })))
      .catch(() => {});
  }, [rows]);

  useEffect(() => {
    if (!rows?.length) return;
    const ids = rows.map((o) => o.id);
    customerService
      .driverMetricsForOrders(ids)
      .then((entries) => setDriverMetricsByOrder((prev) => ({ ...prev, ...entries })))
      .catch(() => {});
  }, [rows]);

  const handleOrderClick = async (order: Row) => {
    if (TRACKING_STATUSES.has(order.status)) {
      navigate({ to: "/customer/order/$orderId", params: { orderId: order.id } });
      return;
    }
    setLoadingOrderDetails(true);
    setSelectedOrder(null);
    try {
      const detail = await orderService.detail<OrderDetailResponse>(order.id);
      setSelectedOrder({
        order,
        productName: detail.productName ?? null,
        resellerName: detail.resellerName ?? null,
        rating: detail.rating ?? ratingsByOrder[order.id] ?? null,
      });
    } catch {
      setSelectedOrder({
        order,
        productName: null,
        resellerName: null,
        rating: ratingsByOrder[order.id] ?? null,
      });
    } finally {
      setLoadingOrderDetails(false);
    }
  };

  const canLoadMore = useMemo(() => !!rows?.length && hasMore, [rows, hasMore]);

  return (
    <div className="mx-auto max-w-2xl space-y-3 p-4 pb-24">
      <h1 className="text-lg font-bold">Meus pedidos</h1>

      {rows === null && (
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
                      {STATUS_LABEL[o.status]}
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

      <Drawer
        snapPoints={[0.5, 0.88]}
        open={loadingOrderDetails || !!selectedOrder}
        onOpenChange={(open) => !open && setSelectedOrder(null)}
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
                  {PAYMENT_LABEL[selectedOrder.order.payment_method]}
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
                      onSaved={(rating) => {
                        setRatingsByOrder((prev) => ({
                          ...prev,
                          [selectedOrder.order.id]: rating,
                        }));
                        setSelectedOrder((prev) => (prev ? { ...prev, rating } : prev));
                      }}
                      title="Editar avaliação"
                    />
                  </div>
                )}
                <Button
                  type="button"
                  variant="secondary"
                  className="mt-2 w-full"
                  onClick={() => setSelectedOrder(null)}
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
