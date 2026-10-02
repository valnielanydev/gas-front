import { MapPin, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { fmtMoney } from "@/lib/constants";
import { getPaymentMethodLabel } from "@/lib/order-status";
import type { FullOrder, TrackingProduct, TrackingReseller } from "@/types/order";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: FullOrder;
  product: TrackingProduct | null;
  reseller: TrackingReseller | null;
}

export function OrderDetailsDrawer({ open, onOpenChange, order, product, reseller }: Props) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85dvh] overflow-y-auto p-0">
        <DrawerHeader className="p-4 pb-0 text-left">
          <DrawerTitle>Detalhes do pedido</DrawerTitle>
        </DrawerHeader>
        <div className="space-y-3 p-4">
          <div className="flex items-center gap-3">
            <Package className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1 text-sm">
              {order.quantity}× {product?.name ?? "Produto"}
            </div>
            <span className="text-sm font-bold">{fmtMoney(order.total_amount)}</span>
          </div>
          <div className="flex items-start gap-3 border-t pt-3">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="text-sm">
              <div>{order.delivery_address}</div>
              {order.delivery_reference && (
                <div className="text-xs text-muted-foreground">{order.delivery_reference}</div>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
            <span>Revendedora</span>
            <span>{reseller?.name ?? "—"}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Telefone da revendedora</span>
            <span>{reseller?.phone ?? "Não informado"}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Pagamento</span>
            <Badge variant="outline">{getPaymentMethodLabel(order.payment_method)}</Badge>
          </div>
          {order.payment_method === "cash" && order.needs_change && order.change_for && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Troco para</span>
              <span>
                {Number(order.change_for).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </span>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
