import { Banknote, CreditCard, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PaymentMethod } from "@/types/order";

interface Props {
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  needsChange: boolean;
  onNeedsChangeChange: (needsChange: boolean) => void;
  changeFor: string;
  onChangeForChange: (value: string) => void;
  total: number;
}

export function OrderPaymentSection({
  paymentMethod,
  onPaymentMethodChange,
  needsChange,
  onNeedsChangeChange,
  changeFor,
  onChangeForChange,
  total,
}: Props) {
  return (
    <>
      <section className="space-y-3 rounded-xl border p-3">
        <h3 className="text-sm font-semibold">4. Pagamento</h3>
        <p className="text-xs font-medium text-muted-foreground">Pagamento</p>
        <div className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Button
            type="button"
            size="sm"
            variant={paymentMethod === "cash" ? "default" : "outline"}
            onClick={() => onPaymentMethodChange("cash")}
          >
            <Banknote className="mr-1 h-3.5 w-3.5" /> Dinheiro
          </Button>
          <Button
            type="button"
            size="sm"
            variant={paymentMethod === "pix" ? "default" : "outline"}
            onClick={() => {
              onPaymentMethodChange("pix");
              onNeedsChangeChange(false);
            }}
          >
            <QrCode className="mr-1 h-3.5 w-3.5" /> Pix
          </Button>
          <Button
            type="button"
            size="sm"
            variant={paymentMethod === "card" ? "default" : "outline"}
            onClick={() => {
              onPaymentMethodChange("card");
              onNeedsChangeChange(false);
            }}
          >
            <CreditCard className="mr-1 h-3.5 w-3.5" /> Cartão
          </Button>
        </div>
      </section>

      {paymentMethod === "cash" && (
        <div className="rounded-lg border bg-muted/40 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-sm font-medium">Precisa de troco?</span>
            <div className="flex gap-1">
              <Button
                type="button"
                size="sm"
                variant={needsChange ? "default" : "outline"}
                onClick={() => onNeedsChangeChange(true)}
              >
                Sim
              </Button>
              <Button
                type="button"
                size="sm"
                variant={!needsChange ? "default" : "outline"}
                onClick={() => {
                  onNeedsChangeChange(false);
                  onChangeForChange("");
                }}
              >
                Não
              </Button>
            </div>
          </div>
          {needsChange && (
            <div>
              <Label htmlFor="change-for" className="text-xs font-medium text-muted-foreground">
                Troco para quanto?
              </Label>
              <Input
                id="change-for"
                type="number"
                min={total}
                step="0.01"
                placeholder={`Ex: ${(Math.ceil(total / 10) * 10).toFixed(2)}`}
                value={changeFor}
                onChange={(e) => onChangeForChange(e.target.value)}
              />
            </div>
          )}
        </div>
      )}

      {paymentMethod === "pix" && (
        <p className="rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          A revendedora enviará a chave Pix ou QR Code após aceitar o pedido.
        </p>
      )}
    </>
  );
}
