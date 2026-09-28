import { useMemo, useState } from "react";
import { Loader2, ShoppingBag } from "lucide-react";
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
import { OrderAddressSection, type DeliveryMode } from "@/components/customer/OrderAddressSection";
import { OrderPaymentSection } from "@/components/customer/OrderPaymentSection";
import { OrderReviewSummary } from "@/components/customer/OrderReviewSummary";
import { toast } from "sonner";
import { emptyAddress, formatAddressValue } from "@/lib/address";
import type { AddressValue } from "@/types/address";
import { estimateEtaMinutes, formatEta } from "@/lib/distance";
import { fmtMoney } from "@/lib/constants";
import { useCreateOrder } from "@/queries/order.queries";
import type { UserProfile } from "@/types/auth";
import type { PaymentMethod } from "@/types/order";
import { geoService } from "@/services/geo.service";
import type { NearbyReseller, Product } from "@/types/reseller";

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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [needsChange, setNeedsChange] = useState(false);
  const [changeFor, setChangeFor] = useState("");
  const [reference, setReference] = useState("");
  const [receiverName, setReceiverName] = useState(user?.name || user?.email?.split("@")[0] || "");
  const [identifyByName, setIdentifyByName] = useState(true);
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>("current");
  const [customAddress, setCustomAddress] = useState<AddressValue>(emptyAddress);
  const [address, setAddress] = useState(initialAddress);
  // Coordinates of the suggestion picked in the autocomplete; cleared when the text changes
  const [pickedCoords, setPickedCoords] = useState<[number, number] | null>(null);
  // Geocoding the typed address before creating the order
  const [resolvingCoords, setResolvingCoords] = useState(false);

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

  const createOrder = useCreateOrder({
    onSuccess: (result) => {
      toast.success("Pedido enviado!");
      onOpenChange(false);
      onOrderPlaced(result.id);
    },
    onError: (err) => toast.error(err.message || "Não foi possível criar o pedido"),
  });
  const submitting = createOrder.isPending || resolvingCoords;

  /**
   * Delivery point for the "current location" mode: the picked suggestion, or the GPS
   * position while the address is still the one derived from it (the initial one).
   */
  const currentModeCoords = (): [number, number] | null => {
    if (pickedCoords) return pickedCoords;
    if (address.trim() === initialAddress.trim()) return initialPos;
    return null;
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
    let changeForValue: number | null = null;
    if (paymentMethod === "cash" && needsChange) {
      const v = parseFloat(changeFor.replace(",", "."));
      if (!Number.isFinite(v) || v < total) {
        toast.error("Informe um valor de troco maior ou igual ao total");
        return;
      }
      changeForValue = v;
    }
    let deliveryCoords = usingCustom
      ? customAddress.latitude != null && customAddress.longitude != null
        ? ([customAddress.latitude, customAddress.longitude] as [number, number])
        : null
      : currentModeCoords();
    if (!deliveryCoords && !usingCustom) {
      // Typed without picking a suggestion: locate the typed text itself. Never fall back
      // to the GPS position, which may be somewhere else entirely.
      setResolvingCoords(true);
      try {
        const [match] = await geoService.searchAddress(resolved, { near: initialPos });
        if (match) deliveryCoords = [match.lat, match.lon];
      } catch {
        // handled below
      } finally {
        setResolvingCoords(false);
      }
    }
    if (!deliveryCoords) {
      toast.error("Não encontramos esse endereço no mapa. Escolha uma das sugestões.");
      setOrderStage("form");
      return;
    }
    const [deliveryLat, deliveryLng] = deliveryCoords;
    createOrder.mutate({
      resellerId: reseller.id,
      productId: product.id,
      quantity,
      unitPrice: product.price,
      totalAmount: Number(product.price) * quantity,
      deliveryAddress: resolved,
      deliveryReference,
      deliveryLatitude: deliveryLat,
      deliveryLongitude: deliveryLng,
      paymentMethod,
      needsChange: paymentMethod === "cash" ? needsChange : false,
      changeFor: changeForValue,
      customerIdentificationType: identifyByName ? "nome" : "anonimo",
      receiverName: receiverName.trim(),
    });
  };

  const total = useMemo(
    () => (product ? Number(product.price) * quantity : 0),
    [product, quantity],
  );

  const normalizedChangeFor = useMemo(() => {
    const parsed = parseFloat(changeFor.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : null;
  }, [changeFor]);

  const resolvedAddress = useMemo(
    () => (deliveryMode === "custom" ? formatAddressValue(customAddress) : address.trim()),
    [deliveryMode, customAddress, address],
  );
  const deliveryReference = reference.trim() || customAddress.complement.trim() || null;

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
            <OrderAddressSection
              deliveryMode={deliveryMode}
              onDeliveryModeChange={setDeliveryMode}
              address={address}
              onAddressChange={(v) => {
                setAddress(v);
                setPickedCoords(null);
              }}
              onAddressSelect={(s) => setPickedCoords([s.lat, s.lon])}
              near={initialPos}
              customAddress={customAddress}
              onCustomAddressChange={setCustomAddress}
            />

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

            <OrderPaymentSection
              paymentMethod={paymentMethod}
              onPaymentMethodChange={setPaymentMethod}
              needsChange={needsChange}
              onNeedsChangeChange={setNeedsChange}
              changeFor={changeFor}
              onChangeForChange={setChangeFor}
              total={total}
            />

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
          <OrderReviewSummary
            receiverName={receiverName.trim()}
            address={resolvedAddress}
            reference={deliveryReference}
            paymentMethod={paymentMethod}
            needsChange={needsChange}
            normalizedChangeFor={normalizedChangeFor}
            total={total}
          />
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
