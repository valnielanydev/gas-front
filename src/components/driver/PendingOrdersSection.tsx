import { Banknote, CircleDot, CreditCard, Loader2, MapPin, Power, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { CustomerDetails } from "@/types/driver";
import type { OrderRow } from "@/types/order";
import { fmtMoney } from "@/lib/constants";
import { getPaymentMethodLabel } from "@/lib/order-status";

interface Props {
  isOnline: boolean;
  orders: OrderRow[];
  customerMap: Record<string, CustomerDetails>;
  distanceLabel: (order: OrderRow) => string | null;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  acceptingId: string | null;
  onAccept: (id: string) => void;
}

export function PendingOrdersSection({
  isOnline,
  orders,
  customerMap,
  distanceLabel,
  selectedId,
  onSelect,
  acceptingId,
  onAccept,
}: Props) {
  if (!isOnline) {
    return (
      <Card className="shadow-[var(--shadow-soft)]">
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Power className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Você está offline</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Ative o status acima para começar a receber chamadas.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (orders.length === 0) {
    return (
      <Card className="shadow-[var(--shadow-soft)]">
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <div className="relative flex h-14 w-14 items-center justify-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
            <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary/30">
              <span className="h-3 w-3 rounded-full bg-primary" />
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Aguardando chamadas…</p>
            <p className="mt-1 text-xs text-muted-foreground">Você está online e disponível.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const selectedPending = selectedId ? (orders.find((o) => o.id === selectedId) ?? null) : null;

  return (
    <>
      {selectedPending && (
        <Card className="overflow-hidden border-accent/50 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between gap-2 bg-accent px-5 py-2.5 text-accent-foreground">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-foreground opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary-foreground" />
              </span>
              <span className="text-xs font-semibold uppercase tracking-wide">Nova chamada</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Fechar"
              className="h-8 w-8 text-white hover:bg-white/20 hover:text-white"
              onClick={() => onSelect(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardContent className="space-y-5 p-5">
            <div className="rounded-xl border border-accent/20 bg-accent/10 p-3 text-center">
              <div className="text-3xl font-bold tracking-tight">
                {fmtMoney(selectedPending.total_amount)}
              </div>
              <div className="mt-1 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                {selectedPending.payment_method === "cash" ? (
                  <Banknote className="h-3.5 w-3.5" />
                ) : (
                  <CreditCard className="h-3.5 w-3.5" />
                )}
                {getPaymentMethodLabel(selectedPending.payment_method)} • {selectedPending.quantity}
                × botijão
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-accent/20 bg-accent/10 p-3">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">Endereço de entrega</div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {selectedPending.delivery_address}
                </div>
                {selectedPending.delivery_reference && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    Ref.: {selectedPending.delivery_reference}
                  </div>
                )}
              </div>
            </div>
            <div className="rounded-lg border border-accent/20 bg-card p-3 text-xs space-y-1">
              <div>
                <strong>Cliente:</strong>{" "}
                {customerMap[selectedPending.id]?.customer_name ?? "Cliente"}
              </div>
              {distanceLabel(selectedPending) && (
                <div className="text-muted-foreground">
                  Distância: {distanceLabel(selectedPending)}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                size="lg"
                className="h-14 flex-1 text-base font-semibold"
                onClick={() => onAccept(selectedPending.id)}
                disabled={acceptingId !== null}
              >
                {acceptingId === selectedPending.id && (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                )}
                Aceitar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      <div className="space-y-2 pt-2">
        <h2 className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Pedidos pendentes ({orders.length})
        </h2>
        {orders.map((o) => (
          <div
            key={o.id}
            className="flex w-full items-center justify-between gap-3 rounded-xl border border-accent/20 bg-card p-3 text-left shadow-sm transition-colors hover:bg-accent/10"
          >
            <button
              onClick={() => onSelect(o.id)}
              disabled={acceptingId !== null}
              className="min-w-0 flex-1 text-left disabled:opacity-60"
            >
              <div className="flex items-center gap-2 truncate text-sm font-medium">
                <CircleDot className="h-3.5 w-3.5 text-accent" />
                Pedido disponível
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {fmtMoney(o.total_amount)} • {getPaymentMethodLabel(o.payment_method)}
              </div>
              {distanceLabel(o) && (
                <div className="mt-0.5 text-xs text-muted-foreground">
                  Distância: {distanceLabel(o)}
                </div>
              )}
            </button>
            <Button
              type="button"
              variant="secondary"
              className="border border-accent/30 bg-accent/10 text-accent hover:bg-accent/20"
              onClick={() => onSelect(o.id)}
              disabled={acceptingId !== null}
            >
              Ver detalhes
            </Button>
            {acceptingId === o.id && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          </div>
        ))}
      </div>
    </>
  );
}
