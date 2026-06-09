import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Loader2,
  MapPin,
  Navigation,
  Package,
  Home,
  ChevronRight,
  Timer,
  CheckCircle2,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/auth/AuthProvider";
import { customerService } from "@/services/customer.service";
import { resellerService } from "@/services/reseller.service";
import { estimateEtaMinutes, formatEta } from "@/lib/distance";
import { fmtMoney, NOMINATIM_HEADERS } from "@/lib/constants";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useNearbyResellers } from "@/hooks/useNearbyResellers";
import type { Reseller } from "@/hooks/useNearbyResellers";
import { AddressDrawer } from "@/components/customer/AddressDrawer";
import type { AddressConfirmResult } from "@/components/customer/AddressDrawer";
import { OrderDialog } from "@/components/customer/OrderDialog";
import type { Product } from "@/components/customer/OrderDialog";

export const Route = createFileRoute("/customer/")({
  component: CustomerHome,
});

const summarizeAddress = (value: string) =>
  value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 3)
    .join(", ") || value;

function CustomerHome() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { pos, setPos, error: geoError, setError: setGeoError } = useGeolocation();
  const { resellers, loading, visibleCount, sentinelRef } = useNearbyResellers(pos);

  const [selected, setSelected] = useState<Reseller | null>(null);
  const [products, setProducts] = useState<Product[] | null>(null);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [productsLoading, setProductsLoading] = useState(false);
  const productsRequestRef = useRef(0);

  const [orderOpen, setOrderOpen] = useState(false);
  const [orderProduct, setOrderProduct] = useState<Product | null>(null);

  const [hasActiveOrder, setHasActiveOrder] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);

  const [lastAddress, setLastAddress] = useState<{
    address: string;
    label: string | null;
    lat: number | null;
    lng: number | null;
  } | null>(null);

  const [manualOpen, setManualOpen] = useState(false);
  const [address, setAddress] = useState("");
  const [addressTouched, setAddressTouched] = useState(false);

  const resetFlowState = useCallback(() => {
    setSelected(null);
    setProducts(null);
    setProductsError(null);
    setProductsLoading(false);
    setOrderOpen(false);
    setOrderProduct(null);
    productsRequestRef.current = 0;
  }, []);

  // Open address drawer on any geolocation error (denied, timeout, or unavailable)
  useEffect(() => {
    if (geoError) setManualOpen(true);
  }, [geoError]);

  useEffect(() => {
    resetFlowState();
  }, [user?.id, resetFlowState]);

  // Load last used delivery address
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    customerService
      .lastDeliveryAddress()
      .then((data) => {
        if (cancelled || !data?.delivery_address) return;
        setLastAddress({
          address: data.delivery_address,
          label: null,
          lat: data.delivery_latitude != null ? Number(data.delivery_latitude) : null,
          lng: data.delivery_longitude != null ? Number(data.delivery_longitude) : null,
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // Reverse-geocode the GPS position into a human-readable address (once, before user touches it)
  useEffect(() => {
    if (!pos || addressTouched || address.trim()) return;
    (async () => {
      try {
        const params = new URLSearchParams({
          format: "json",
          lat: String(pos[0]),
          lon: String(pos[1]),
          addressdetails: "1",
        });
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, {
          headers: NOMINATIM_HEADERS,
        });
        const data = (await res.json()) as { display_name?: string };
        if (data.display_name && !addressTouched) setAddress(data.display_name);
      } catch {
        // noop
      }
    })();
  }, [pos, addressTouched]);

  useEffect(() => {
    if (!user?.id) return;
    customerService
      .activeOrder()
      .then((data) => {
        setHasActiveOrder(Boolean(data?.id));
        setActiveOrderId(data?.id ?? null);
      })
      .catch(() => {});
  }, [user?.id]);

  const applyLastAddress = () => {
    if (!lastAddress) return;
    setAddress(lastAddress.address);
    setAddressTouched(true);
    if (lastAddress.lat != null && lastAddress.lng != null) {
      setPos([lastAddress.lat, lastAddress.lng]);
      setGeoError(null);
    }
    toast.success("Endereço reutilizado. Escolha uma revendedora para continuar.");
  };

  const openReseller = async (r: Reseller) => {
    const requestId = productsRequestRef.current + 1;
    productsRequestRef.current = requestId;
    setSelected(r);
    setProducts(null);
    setProductsError(null);
    setProductsLoading(true);
    try {
      const data = await resellerService.products(r.id);
      if (requestId !== productsRequestRef.current) return;
      setProducts(data ?? []);
    } catch (err) {
      if (requestId !== productsRequestRef.current) return;
      const message = err instanceof Error ? err.message : "Falha inesperada ao buscar produtos";
      setProductsError(message);
      toast.error(message);
    } finally {
      if (requestId === productsRequestRef.current) setProductsLoading(false);
    }
  };

  const startOrder = (p: Product) => {
    if (hasActiveOrder && activeOrderId) {
      toast.error("Você já possui um pedido ativo.");
      navigate({ to: "/customer/order/$orderId", params: { orderId: activeOrderId } });
      return;
    }
    setOrderProduct(p);
    setOrderOpen(true);
  };

  const handleAddressConfirmed = ({
    address: confirmedAddress,
    pos: confirmedPos,
  }: AddressConfirmResult) => {
    setAddress(confirmedAddress);
    setAddressTouched(true);
    setGeoError(null);
    if (confirmedPos) setPos(confirmedPos);
  };

  const handleOrderPlaced = (orderId: string) => {
    setSelected(null);
    navigate({ to: "/customer/order/$orderId", params: { orderId } });
  };

  return (
    <div className="min-h-[100dvh] w-full bg-[radial-gradient(circle_at_top,_hsl(var(--primary)/0.08),_transparent_32rem),hsl(var(--background))] pb-24">
      <div className="mx-auto flex min-h-[calc(100dvh-6rem)] max-w-2xl flex-col gap-4 px-4 pt-4 sm:px-6 sm:pt-6">
        <header className="flex items-center justify-between gap-3 py-1">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">GasFlow</p>
            <h1 className="truncate text-2xl font-black tracking-tight">
              Olá
              {user?.fullName ? `, ${user.fullName.split(" ")[0]}` : ""}
            </h1>
          </div>
          {hasActiveOrder && activeOrderId && (
            <Button
              size="sm"
              variant="secondary"
              className="shrink-0 rounded-full px-3"
              onClick={() =>
                navigate({ to: "/customer/order/$orderId", params: { orderId: activeOrderId } })
              }
            >
              Pedido ativo
            </Button>
          )}
        </header>

        <section className="space-y-3">
          <button
            type="button"
            onClick={() => setManualOpen(true)}
            className="group flex w-full items-center gap-4 rounded-[2rem] border border-primary/10 bg-card/95 p-5 text-left shadow-xl shadow-primary/5 ring-1 ring-white/40 transition duration-200 active:scale-[0.99] hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <Search className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-lg font-black leading-tight">Para onde entregar?</div>
              <div className="mt-1 line-clamp-2 text-sm leading-snug text-muted-foreground">
                {address ||
                  (geoError === "denied"
                    ? "Toque para informar seu endereço"
                    : geoError
                      ? "GPS indisponível — toque para informar seu endereço"
                      : "Use sua localização ou busque um endereço")}
              </div>
            </div>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition group-hover:bg-primary/10 group-hover:text-primary">
              <ChevronRight className="h-5 w-5" />
            </div>
          </button>

          {lastAddress && (
            <button
              type="button"
              onClick={applyLastAddress}
              className="flex w-full items-center gap-3 rounded-3xl border bg-card/85 p-3.5 text-left shadow-sm transition active:scale-[0.99] hover:border-primary/30"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Home className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold">
                  {lastAddress.label ?? "Último endereço"}
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  {summarizeAddress(lastAddress.address)}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </section>

        <section className="flex min-h-0 flex-1 flex-col pt-1">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-black tracking-tight">Revendedoras próximas</h2>
              <p className="text-sm text-muted-foreground">
                Ordenadas da menor para a maior distância
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              {loading
                ? "Buscando"
                : resellers.length
                  ? `${resellers.length} opções`
                  : geoError
                    ? "Endereço"
                    : "0 opções"}
            </span>
          </div>

          <div className="space-y-3 pb-2">
            {loading &&
              Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-[132px] animate-pulse rounded-[1.75rem] border bg-card/70 p-4 shadow-sm"
                >
                  <div className="flex gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-muted" />
                    <div className="flex-1 space-y-3">
                      <div className="h-4 w-2/3 rounded-full bg-muted" />
                      <div className="h-3 w-full rounded-full bg-muted" />
                      <div className="h-3 w-3/4 rounded-full bg-muted" />
                    </div>
                  </div>
                </div>
              ))}

            {!loading && resellers.length === 0 && (
              <Card className="rounded-[1.75rem] border-dashed bg-card/80">
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  {geoError
                    ? "Informe seu endereço para ver revendedoras próximas."
                    : "Nenhuma revendedora ativa por perto."}
                </CardContent>
              </Card>
            )}

            {!loading &&
              resellers.slice(0, visibleCount).map((r, index) => {
                const distance = Number(r.distance_km);
                const eta = estimateEtaMinutes(distance);
                return (
                  <button
                    key={r.id}
                    aria-label={`Ver produtos de ${r.name}`}
                    onClick={() => void openReseller(r)}
                    className="group w-full rounded-[1.75rem] border bg-card p-4 text-left shadow-sm transition duration-200 active:scale-[0.99] hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="line-clamp-1 text-base font-black leading-tight">
                                {r.name}
                              </span>
                              {index === 0 && (
                                <Badge
                                  variant="secondary"
                                  className="shrink-0 rounded-full text-[10px]"
                                >
                                  Mais perto
                                </Badge>
                              )}
                            </div>
                            <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="h-3 w-3" />
                              Disponível
                            </div>
                          </div>
                          {r.min_price != null && (
                            <div className="shrink-0 rounded-2xl bg-primary/10 px-3 py-2 text-right">
                              <div className="text-[10px] font-semibold uppercase tracking-wide text-primary/80">
                                a partir de
                              </div>
                              <div className="text-base font-black text-primary">
                                {fmtMoney(Number(r.min_price))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="rounded-2xl bg-muted/55 px-2.5 py-2">
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Navigation className="h-3.5 w-3.5 text-primary" />
                              Distância
                            </span>
                            <strong className="mt-0.5 block text-sm">
                              {distance.toFixed(1)} km
                            </strong>
                          </div>
                          <div className="rounded-2xl bg-muted/55 px-2.5 py-2">
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Timer className="h-3.5 w-3.5" />
                              Tempo
                            </span>
                            <strong className="mt-0.5 block text-sm">{formatEta(eta)}</strong>
                          </div>
                          <div className="min-w-0 rounded-2xl bg-muted/55 px-2.5 py-2">
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <MapPin className="h-3.5 w-3.5" />
                              Cidade
                            </span>
                            <strong className="mt-0.5 block truncate text-sm">
                              {r.city ?? "—"}
                            </strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}

            {!loading && visibleCount < resellers.length && (
              <div ref={sentinelRef} className="flex justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Reseller products drawer */}
      <Drawer open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DrawerContent className="z-[500] flex max-h-[85dvh] flex-col">
          {selected && (
            <>
              <DrawerHeader className="shrink-0 text-left">
                <DrawerTitle>{selected.name}</DrawerTitle>
                <DrawerDescription>
                  {selected.city ?? "—"} • {selected.distance_km} km •{" "}
                  {formatEta(estimateEtaMinutes(Number(selected.distance_km)))}
                </DrawerDescription>
              </DrawerHeader>
              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 pb-6">
                {productsLoading && (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                )}
                {products?.length === 0 && (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Sem produtos disponíveis no momento.
                  </p>
                )}
                {!!productsError && (
                  <p className="py-3 text-center text-sm text-destructive">
                    Falha ao carregar produtos: {productsError}
                  </p>
                )}
                {products?.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-3 rounded-xl border bg-background p-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Package className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">{p.name}</div>
                        <div className="text-base font-bold text-primary">
                          {fmtMoney(Number(p.price))}
                        </div>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => startOrder(p)}>
                      {hasActiveOrder ? "Ver pedido ativo" : "Pedir"}
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}
        </DrawerContent>
      </Drawer>

      <OrderDialog
        key={orderProduct?.id ?? "none"}
        open={orderOpen}
        onOpenChange={setOrderOpen}
        product={orderProduct}
        reseller={selected}
        user={user}
        initialAddress={address}
        initialPos={pos}
        onOrderPlaced={handleOrderPlaced}
      />

      <AddressDrawer
        open={manualOpen}
        onOpenChange={setManualOpen}
        near={pos}
        onConfirm={handleAddressConfirmed}
      />
    </div>
  );
}
