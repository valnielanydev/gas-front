import { getOrderStatusLabel } from "@/i18n/ptBR";

export { getOrderStatusLabel };
import type { CustomerOrderStatus, DriverOrderStatus, PaymentMethod } from "@/types/order";

export type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

const STATUS_VARIANT: Record<CustomerOrderStatus, BadgeVariant> = {
  pending: "outline",
  accepted: "secondary",
  in_delivery: "default",
  delivered: "default",
  cancelled: "destructive",
  cancelado_pelo_motorista: "destructive",
  cancelled_by_customer: "destructive",
  expired: "outline",
};

/** Label and badge variant for an order status; unknown statuses fall back to the raw value. */
export function getOrderStatusBadge(status: string): { label: string; variant: BadgeVariant } {
  return {
    label: getOrderStatusLabel(status),
    variant: STATUS_VARIANT[status as CustomerOrderStatus] ?? "outline",
  };
}

/** Statuses a reseller can set manually on the orders screen. */
export const RESELLER_STATUS_OPTIONS: DriverOrderStatus[] = [
  "pending",
  "accepted",
  "in_delivery",
  "delivered",
  "cancelled",
  "cancelado_pelo_motorista",
];

const CANCELLED_STATUSES: ReadonlySet<string> = new Set([
  "cancelled",
  "cancelado_pelo_motorista",
  "cancelled_by_customer",
]);

/** Order is still in progress: waiting for a driver or being delivered. */
export function isOrderActive(status: string): boolean {
  return status === "pending" || status === "accepted" || status === "in_delivery";
}

/** A driver accepted the order and is on the way (or about to leave). */
export function isDriverAssigned(status: string): boolean {
  return status === "accepted" || status === "in_delivery";
}

export function isOrderCancelled(status: string): boolean {
  return CANCELLED_STATUSES.has(status);
}

/** Order reached a final state: delivered, cancelled or expired. */
export function isOrderFinished(status: string): boolean {
  return status === "delivered" || status === "expired" || isOrderCancelled(status);
}

const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  cash: "Dinheiro",
  card: "Cartão",
  pix: "Pix",
};

export function getPaymentMethodLabel(method: PaymentMethod): string {
  return PAYMENT_LABEL[method];
}
