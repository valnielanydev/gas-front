import { fmtMoney } from "@/lib/constants";
import { getPaymentMethodLabel } from "@/lib/order-status";
import type { PaymentMethod } from "@/types/order";

interface Props {
  receiverName: string;
  address: string;
  reference: string | null;
  paymentMethod: PaymentMethod;
  needsChange: boolean;
  /** Parsed "troco para" amount, if the customer typed a valid one. */
  normalizedChangeFor: number | null;
  total: number;
}

export function OrderReviewSummary({
  receiverName,
  address,
  reference,
  paymentMethod,
  needsChange,
  normalizedChangeFor,
  total,
}: Props) {
  return (
    <div className="space-y-4">
      <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
        Confirme os dados para evitar problemas na entrega
      </p>
      <div className="space-y-3 rounded-lg border p-3">
        <div>
          <p className="text-xs text-muted-foreground">👤 Nome do recebedor</p>
          <p className="text-sm font-medium">{receiverName}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">📍 Endereço</p>
          <p className="text-sm font-medium">{address || "—"}</p>
          <p className="text-xs text-muted-foreground">
            Referência: {reference || "Não informada"}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">💳 Pagamento</p>
          <p className="text-sm font-medium">{getPaymentMethodLabel(paymentMethod)}</p>
          {paymentMethod === "cash" && (
            <p className="text-xs text-muted-foreground">
              {needsChange
                ? `Troco para ${fmtMoney(normalizedChangeFor ?? total)} (troco: ${fmtMoney(Math.max((normalizedChangeFor ?? total) - total, 0))}).`
                : "Não precisa de troco."}
            </p>
          )}
        </div>
        <div>
          <p className="text-xs text-muted-foreground">💰 Total</p>
          <p className="text-sm font-medium">{fmtMoney(total)}</p>
        </div>
      </div>
    </div>
  );
}
