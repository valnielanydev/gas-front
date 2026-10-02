import { Badge } from "@/components/ui/badge";
import { getOrderStatusBadge } from "@/lib/order-status";

export function OrderStatusBadge({ status }: { status: string }) {
  const { label, variant } = getOrderStatusBadge(status);
  return <Badge variant={variant}>{label}</Badge>;
}
