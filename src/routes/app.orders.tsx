import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { resellerService } from "@/services/reseller.service";
import { orderService } from "@/services/order.service";
import { fmtMoney } from "@/lib/constants";
import { useAuth } from "@/auth/AuthProvider";
import { format } from "date-fns";
import { getOrderStatusLabel } from "@/i18n/ptBR";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/app/orders")({
  component: ResellerOrdersPage,
});

interface Order {
  id: string;
  created_at: string;
  status: string;
  delivery_address: string | null;
  total_amount: number;
  quantity: number;
  delivery_code: string | null;
  product?: { name: string } | null;
}

const statusOptions = [
  "pending",
  "accepted",
  "in_delivery",
  "delivered",
  "cancelled",
  "cancelado_pelo_motorista",
];
const statusLabels: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  pending: { label: getOrderStatusLabel("pending"), variant: "outline" },
  accepted: { label: getOrderStatusLabel("accepted"), variant: "secondary" },
  in_delivery: { label: getOrderStatusLabel("in_delivery"), variant: "default" },
  delivered: { label: getOrderStatusLabel("delivered"), variant: "default" },
  cancelled: { label: getOrderStatusLabel("cancelled"), variant: "destructive" },
  cancelado_pelo_motorista: {
    label: getOrderStatusLabel("cancelado_pelo_motorista"),
    variant: "destructive",
  },
};

function ResellerOrdersPage() {
  const { resellerId } = useAuth();
  const qc = useQueryClient();
  const { data: orders, isLoading } = useQuery({
    queryKey: ["reseller-orders", resellerId],
    enabled: !!resellerId,
    queryFn: () => resellerService.orders<Order>(resellerId!),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      orderService.updateStatus(id, status),
    onSuccess: () => {
      toast.success("Status atualizado");
      qc.invalidateQueries({ queryKey: ["reseller-orders"] });
    },
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
                          <Badge variant={statusLabels[o.status]?.variant ?? "outline"}>
                            {statusLabels[o.status]?.label ?? o.status}
                          </Badge>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((s) => (
                          <SelectItem key={s} value={s}>
                            {statusLabels[s]?.label ?? s}
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
