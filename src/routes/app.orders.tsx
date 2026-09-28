import { createFileRoute } from "@tanstack/react-router";
import { Loader2, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useResellerOrders, useUpdateResellerOrderStatus } from "@/queries/reseller.queries";
import { fmtMoney } from "@/lib/constants";
import { useAuth } from "@/auth/AuthProvider";
import { format } from "date-fns";
import { getOrderStatusLabel, RESELLER_STATUS_OPTIONS } from "@/lib/order-status";
import { OrderStatusBadge } from "@/components/order/OrderStatusBadge";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/app/orders")({
  component: ResellerOrdersPage,
});

function ResellerOrdersPage() {
  const { resellerId } = useAuth();
  const { data: orders, isLoading } = useResellerOrders(resellerId);

  const updateStatus = useUpdateResellerOrderStatus(resellerId, {
    onSuccess: () => toast.success("Status atualizado"),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  if (!resellerId) {
    return <p className="text-muted-foreground">Sem revendedora vinculada.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pedidos</h1>
        <p className="text-sm text-muted-foreground">Pedidos da sua revendedora</p>
      </div>
      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : !orders?.length ? (
          <div className="flex flex-col items-center gap-2 p-12 text-center">
            <ShoppingCart className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Nenhum pedido recebido ainda</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead className="hidden md:table-cell">Endereço</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Código</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(o.created_at), "dd/MM HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell className="font-medium">
                    {o.product?.name ?? "—"} × {o.quantity}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-xs">
                    {o.delivery_address}
                  </TableCell>
                  <TableCell>{fmtMoney(Number(o.total_amount))}</TableCell>
                  <TableCell>
                    <Select
                      value={o.status}
                      onValueChange={(v) => updateStatus.mutate({ id: o.id, status: v })}
                    >
                      <SelectTrigger className="h-8 w-[130px]">
                        <SelectValue>
                          <OrderStatusBadge status={o.status} />
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {RESELLER_STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s} value={s}>
                            {getOrderStatusLabel(s)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{o.delivery_code}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
