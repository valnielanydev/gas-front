import { createFileRoute } from "@tanstack/react-router";
import { Loader2, ShoppingCart } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdminOrders } from "@/queries/admin.queries";
import { fmtMoney } from "@/lib/constants";
import { format } from "date-fns";
import { OrderStatusBadge } from "@/components/order/OrderStatusBadge";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/master/orders")({
  component: OrdersPage,
});

function OrdersPage() {
  const { data: orders, isLoading } = useAdminOrders(100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pedidos Globais</h1>
        <p className="text-sm text-muted-foreground">Últimos 100 pedidos da plataforma</p>
      </div>
      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : !orders?.length ? (
          <div className="flex flex-col items-center gap-2 p-12">
            <ShoppingCart className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Nenhum pedido ainda</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Revendedora</TableHead>
                <TableHead className="hidden md:table-cell">Produto</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(o.created_at), "dd/MM HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell className="font-medium">{o.reseller?.name ?? "—"}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {o.product?.name ?? "—"} × {o.quantity}
                  </TableCell>
                  <TableCell>{fmtMoney(Number(o.total_amount))}</TableCell>
                  <TableCell>
                    <OrderStatusBadge status={o.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
