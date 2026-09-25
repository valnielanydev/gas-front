import { Suspense, lazy, useMemo, useState } from "react";
import { Loader2, Banknote, CreditCard, QrCode, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { AddressAutocomplete } from "@/components/address/AddressAutocomplete";
import { emptyAddress } from "@/components/address/AddressMapPicker";
import type { AddressValue } from "@/components/address/AddressMapPicker";
import { toast } from "sonner";
import { estimateEtaMinutes, formatEta } from "@/lib/distance";
import { fmtMoney } from "@/lib/constants";
import { getPaymentMethodLabel } from "@/lib/order-status";
import type { UserProfile } from "@/types/auth";
import { orderService } from "@/services/order.service";
import { geoService } from "@/services/geo.service";
import type { NearbyReseller, Product } from "@/types/reseller";

const AddressMapPicker = lazy(() =>
  import("@/components/address/AddressMapPicker").then((m) => ({ default: m.AddressMapPicker })),
);

function AddressMapPickerFallback() {
  return (
    <div className="flex min-h-44 items-center justify-center rounded-3xl border bg-muted/40 text-sm text-muted-foreground">
      <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" />
      Carregando mapa...
    </div>
  );
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  reseller: NearbyReseller | null;
  user: UserProfile | null;
  initialAddress: string;
  initialPos: [number, number] | null;
  onOrderPlaced: (orderId: string) => void;
}

export function OrderDialog({
  open,
  onOpenChange,
  product,
  reseller,
  user,
  initialAddress,
  initialPos,
  onOrderPlaced,
}: Props) {
  const [orderStage, setOrderStage] = useState<"form" | "review">("form");
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "pix">("cash");
  const [needsChange, setNeedsChange] = useState(false);
  const [changeFor, setChangeFor] = useState("");
  const [reference, setReference] = useState("");
  const [receiverName, setReceiverName] = useState(user?.name || user?.email?.split("@")[0] || "");
  const [identifyByName, setIdentifyByName] = useState(true);
  const [deliveryMode, setDeliveryMode] = useState<"current" | "custom">("current");
  const [customAddress, setCustomAddress] = useState<AddressValue>(emptyAddress);
  const [address, setAddress] = useState(initialAddress);
  const [addressTouched, setAddressTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const hasCompleteAddress = () => {
    if (!resolvedAddress) return false;
    if (deliveryMode !== "custom") return true;
    return Boolean(customAddress.street && customAddress.number && customAddress.city);
  };

  const goToReviewStep = () => {
    if (!resolvedAddress || !hasCompleteAddress()) {
      toast.error("Informe um endereço completo para entrega");
      return;
    }
    if (!receiverName.trim()) {
      toast.error("Informe quem vai receber o pedido");
      return;
    }
    setOrderStage("review");
  };

  const confirmOrder = async () => {
    if (!user || !reseller || !product) return;
    const usingCustom = deliveryMode === "custom";
    const resolved = resolvedAddress;
    if (!resolved || !hasCompleteAddress()) {
      toast.error("Informe um endereço completo de entrega");
      return;
    }
    if (!receiverName.trim()) {
      toast.error("Informe quem vai receber o pedido");
      return;
    }
    setSubmitting(true);
    let changeForValue: number | null = null;
    if (paymentMethod === "cash" && needsChange) {
      const v = parseFloat(changeFor.replace(",", "."));
      if (!Number.isFinite(v) || v < total) {
        toast.error("Informe um valor de troco maior ou igual ao total");
        setSubmitting(false);
        return;
      }
      changeForValue = v;
    }
    let deliveryLat: number | null = usingCustom
      ? customAddress.latitude
      : (initialPos?.[0] ?? null);
    let deliveryLng: number | null = usingCustom
      ? customAddress.longitude
      : (initialPos?.[1] ?? null);
    if ((!deliveryLat || !deliveryLng) && !usingCustom) {
      try {
        const [match] = await geoService.searchAddress(resolved);
        if (match) {
          deliveryLat = match.lat;
          deliveryLng = match.lon;
        }
      } catch {
        // keep GPS fallback
      }
    }
    let result: { id: string };
    try {
      result = await orderService.create({
        resellerId: reseller.id,
        productId: product.id,
        quantity,
        unitPrice: product.price,
        totalAmount: Number(product.price) * quantity,
        deliveryAddress: resolved,
        deliveryReference: reference.trim() || customAddress.complement.trim() || null,
        deliveryLatitude: deliveryLat,
        deliveryLongitude: deliveryLng,
        paymentMethod,
        needsChange: paymentMethod === "cash" ? needsChange : false,
        changeFor: changeForValue,
        customerIdentificationType: identifyByName ? "nome" : "anonimo",
        receiverName: receiverName.trim(),
      });
    } catch (err) {
      setSubmitting(false);
      toast.error(err instanceof Error ? err.message : "Não foi possível criar o pedido");
      return;
    }
    setSubmitting(false);
    toast.success("Pedido enviado!");
    onOpenChange(false);
    onOrderPlaced(result.id);
  };

  const total = useMemo(
    () => (product ? Number(product.price) * quantity : 0),
    [product, quantity],
  );

  const normalizedChangeFor = useMemo(() => {
    const parsed = parseFloat(changeFor.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : null;
  }, [changeFor]);

  const resolvedAddress = useMemo(() => {
    const usingCustom = deliveryMode === "custom";
    if (!usingCustom) return address.trim();
    return [
      customAddress.street && customAddress.number
        ? `${customAddress.street}, ${customAddress.number}`
        : customAddress.street,
      customAddress.neighborhood,
      customAddress.city && customAddress.state
        ? `${customAddress.city} - ${customAddress.state}`
        : customAddress.city || customAddress.state,
      customAddress.postalCode,
    ]
      .filter(Boolean)
      .join(", ");
  }, [deliveryMode, customAddress, address]);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) setOrderStage("form");
      }}
    >
      <DialogContent className="z-[600] max-h-[92dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Confirmar pedido</DialogTitle>
          <DialogDescription>
            {product?.name} • {reseller?.name}
          </DialogDescription>
        </DialogHeader>

        {orderStage === "form" ? (
          <div className="space-y-4">
            <section className="space-y-2 rounded-xl border p-3">
              <h3 className="text-sm font-semibold">1. Endereço</h3>
              <p className="text-xs font-medium text-muted-foreground">Endereço de entrega *</p>
              <div className="mb-2 mt-1 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Button
                  type="button"
                  size="sm"
                  variant={deliveryMode === "current" ? "default" : "outline"}
                  onClick={() => setDeliveryMode("current")}
                >
                  Minha localização atual
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={deliveryMode === "custom" ? "default" : "outline"}
                  onClick={() => setDeliveryMode("custom")}
                >
                  Outro local
                </Button>
              </div>
              {deliveryMode === "current" ? (
                <AddressAutocomplete
                  value={address}
                  onChange={(v) => {
                    setAddressTouched(true);
                    setAddress(v);
                  }}
                  near={initialPos}
                  placeholder="Rua, número, bairro"
                />
              ) : (
                <Suspense fallback={<AddressMapPickerFallback />}>
                  <AddressMapPicker value={customAddress} onChange={setCustomAddress} />
                </Suspense>
              )}
            </section>

            <section className="space-y-2 rounded-xl border p-3">
              <h3 className="text-sm font-semibold">2. Destinatário</h3>
              <Label htmlFor="receiver-name" className="text-xs font-medium text-muted-foreground">
                Quem vai receber *
              </Label>
              <Input
                id="receiver-name"
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                placeholder="Nome de quem vai receber o pedido"
              />
            </section>

            <section className="space-y-3 rounded-xl border p-3">
              <h3 className="text-sm font-semibold">3. Detalhes</h3>
              <div>
                <Label htmlFor="reference" className="text-xs font-medium text-muted-foreground">
                  Ponto de referência (opcional)
                </Label>
                <Input
                  id="reference"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Ex: portão azul"
                />
              </div>
              <div className="flex min-h-11 items-center space-x-2 rounded-md border p-3">
                <Checkbox
                  id="identifyByName"
                  checked={identifyByName}
                  onCheckedChange={(v) => setIdentifyByName(Boolean(v))}
                />
                <Label htmlFor="identifyByName" className="text-sm">
                  Deseja se identificar no pedido?
                </Label>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <Label htmlFor="quantity" className="text-xs font-medium text-muted-foreground">
                    Quantidade
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    min={1}
                    max={10}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                  />
                </div>
                <div />
              </div>
            </section>

            <section className="space-y-3 rounded-xl border p-3">
              <h3 className="text-sm font-semibold">4. Pagamento</h3>
              <p className="text-xs font-medium text-muted-foreground">Pagamento</p>
              <div className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-3">
                <Button
                  type="button"
                  size="sm"
                  variant={paymentMethod === "cash" ? "default" : "outline"}
                  onClick={() => setPaymentMethod("cash")}
                >
                  <Banknote className="mr-1 h-3.5 w-3.5" /> Dinheiro
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={paymentMethod === "pix" ? "default" : "outline"}
                  onClick={() => {
                    setPaymentMethod("pix");
                    setNeedsChange(false);
                  }}
                >
                  <QrCode className="mr-1 h-3.5 w-3.5" /> Pix
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={paymentMethod === "card" ? "default" : "outline"}
                  onClick={() => {
                    setPaymentMethod("card");
                    setNeedsChange(false);
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
                      onClick={() => setNeedsChange(true)}
                    >
                      Sim
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={!needsChange ? "default" : "outline"}
                      onClick={() => {
                        setNeedsChange(false);
                        setChangeFor("");
                      }}
                    >
                      Não
                    </Button>
                  </div>
                </div>
                {needsChange && (
                  <div>
                    <Label
                      htmlFor="change-for"
                      className="text-xs font-medium text-muted-foreground"
                    >
                      Troco para quanto?
                    </Label>
                    <Input
                      id="change-for"
                      type="number"
                      min={total}
                      step="0.01"
                      placeholder={`Ex: ${(Math.ceil(total / 10) * 10).toFixed(2)}`}
                      value={changeFor}
                      onChange={(e) => setChangeFor(e.target.value)}
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

            <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2">
              <span className="text-sm">Total</span>
              <span className="text-lg font-bold text-primary">{fmtMoney(total)}</span>
            </div>
            {reseller && (
              <p className="text-center text-[11px] text-muted-foreground">
                {reseller.distance_km} km •{" "}
                {formatEta(estimateEtaMinutes(Number(reseller.distance_km)))} estimados
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
              Confirme os dados para evitar problemas na entrega
            </p>
            <div className="space-y-3 rounded-lg border p-3">
              <div>
                <p className="text-xs text-muted-foreground">👤 Nome do recebedor</p>
                <p className="text-sm font-medium">{receiverName.trim()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">📍 Endereço</p>
                <p className="text-sm font-medium">{resolvedAddress || "—"}</p>
                <p className="text-xs text-muted-foreground">
                  Referência:{" "}
                  {reference.trim() || customAddress.complement.trim() || "Não informada"}
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
        )}

        <DialogFooter
          className={orderStage === "review" ? "grid grid-cols-1 gap-2 sm:grid-cols-2" : ""}
        >
          {orderStage === "review" ? (
            <>
              <Button
                type="button"
                variant="outline"
                className="h-12 w-full text-base"
                onClick={() => setOrderStage("form")}
                disabled={submitting}
              >
                ✏️ Editar informações
              </Button>
              <Button
                size="lg"
                className="h-12 w-full text-base"
                onClick={() => void confirmOrder()}
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ShoppingBag className="mr-2 h-4 w-4" />
                )}
                ✅ Confirmar e pedir
              </Button>
            </>
          ) : (
            <Button
              size="lg"
              className="h-12 w-full text-base"
              onClick={goToReviewStep}
              disabled={submitting}
            >
              Revisar dados
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
