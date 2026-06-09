import { CheckCircle2, Clock, Loader2, Truck, XCircle } from "lucide-react";
import type { FullOrder } from "@/types/api";

const STEPS: { key: string; label: string; icon: React.ElementType }[] = [
  { key: "pending", label: "Aguardando motorista", icon: Clock },
  { key: "accepted", label: "Motorista aceitou", icon: CheckCircle2 },
  { key: "in_delivery", label: "A caminho", icon: Truck },
  { key: "delivered", label: "Entregue", icon: CheckCircle2 },
];

interface Props {
  order: FullOrder;
}

export function OrderStatusSteps({ order }: Props) {
  if (order.status === "expired") {
    return (
      <div className="flex items-center gap-3 text-amber-600">
        <Clock className="h-6 w-6" />
        <span className="font-semibold">Pedido expirado — nenhum motorista aceitou</span>
      </div>
    );
  }

  if (
    order.status === "cancelled" ||
    order.status === "cancelado_pelo_motorista" ||
    order.status === "cancelled_by_customer"
  ) {
    return (
      <div className="flex items-center gap-3 text-destructive">
        <XCircle className="h-6 w-6" />
        <span className="font-semibold">
          {order.status === "cancelado_pelo_motorista"
            ? "O motorista cancelou sua entrega"
            : "Pedido cancelado"}
        </span>
      </div>
    );
  }

  const currentIdx = STEPS.findIndex((s) => s.key === order.status);

  return (
    <ol className="space-y-3">
      {STEPS.map((s, i) => {
        const done = i <= currentIdx;
        const active = i === currentIdx;
        const Icon = s.icon;
        return (
          <li
            key={s.key}
            className="flex items-center gap-3"
            aria-current={active ? "step" : undefined}
          >
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
            >
              {active && order.status !== "delivered" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Icon className="h-4 w-4" />
              )}
            </div>
            <span
              className={`text-sm ${done ? "font-semibold text-foreground" : "text-muted-foreground"}`}
            >
              {s.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
