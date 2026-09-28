import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/auth/AuthProvider";
import { useDeliveryAddress } from "@/hooks/useDeliveryAddress";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useNearbyResellers } from "@/hooks/useNearbyResellers";
import { useCustomerActiveOrder, useLastDeliveryAddress } from "@/queries/customer.queries";
import { useResellerProducts } from "@/queries/reseller.queries";
import type { NearbyReseller, Product } from "@/types/reseller";
import { AddressDrawer } from "@/components/customer/AddressDrawer";
import { DeliveryAddressButton } from "@/components/customer/DeliveryAddressButton";
import { LastAddressButton } from "@/components/customer/LastAddressButton";
import { NearbyResellersSection } from "@/components/customer/NearbyResellersSection";
import { OrderDialog } from "@/components/customer/OrderDialog";
import { ResellerProductsDrawer } from "@/components/customer/ResellerProductsDrawer";

export const Route = createFileRoute("/customer/")({
  component: CustomerHome,
});

function CustomerHome() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { pos, setPos, error: geoError, setError: setGeoError } = useGeolocation();
  const { resellers, loading, visibleCount, sentinelRef } = useNearbyResellers(pos, !!geoError);
  const { address, applyLastAddress, confirmAddress } = useDeliveryAddress({
    pos,
    setPos,
    setGeoError,
  });

  const { data: activeOrder } = useCustomerActiveOrder(user?.id);
  const { data: lastAddress } = useLastDeliveryAddress(user?.id);
  const activeOrderId = activeOrder?.id ?? null;

  const [selected, setSelected] = useState<NearbyReseller | null>(null);
  const products = useResellerProducts(selected?.id ?? null, { retry: false });
  const productsError = products.error
    ? products.error.message || "Falha inesperada ao buscar produtos"
    : null;

  const [orderOpen, setOrderOpen] = useState(false);
  const [orderProduct, setOrderProduct] = useState<Product | null>(null);
  const [manualOpen, setManualOpen] = useState(false);

  // Reset the ordering flow when the logged-in customer changes
  useEffect(() => {
    setSelected(null);
    setOrderOpen(false);
    setOrderProduct(null);
  }, [user?.id]);

  useEffect(() => {
    if (productsError) toast.error(productsError);
  }, [productsError]);

  const goToActiveOrder = (orderId: string) =>
    navigate({ to: "/customer/order/$orderId", params: { orderId } });

  const startOrder = (p: Product) => {
    if (activeOrderId) {
      toast.error("Você já possui um pedido ativo.");
      goToActiveOrder(activeOrderId);
      return;
    }
    setOrderProduct(p);
    setOrderOpen(true);
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
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">VaptGás</p>
            <h1 className="truncate text-2xl font-black tracking-tight">
              Olá
              {user?.name ? `, ${user.name.split(" ")[0]}` : ""}
            </h1>
          </div>
          {activeOrderId && (
            <Button
              size="sm"
              variant="secondary"
              className="shrink-0 rounded-full px-3"
              onClick={() => goToActiveOrder(activeOrderId)}
            >
              Pedido ativo
            </Button>
          )}
        </header>

        <section className="space-y-3">
          <DeliveryAddressButton
            address={address}
            geoError={geoError}
            onClick={() => setManualOpen(true)}
          />
          {lastAddress && (
            <LastAddressButton
              address={lastAddress.address}
              onClick={() => applyLastAddress(lastAddress)}
            />
          )}
        </section>

        <NearbyResellersSection
          resellers={resellers}
          loading={loading}
          visibleCount={visibleCount}
          sentinelRef={sentinelRef}
          geoError={geoError}
          onSelect={setSelected}
        />
      </div>

      <ResellerProductsDrawer
        reseller={selected}
        products={products.data}
        loading={products.isFetching}
        error={productsError}
        hasActiveOrder={!!activeOrderId}
        onClose={() => setSelected(null)}
        onOrder={startOrder}
      />

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
        onConfirm={confirmAddress}
      />
    </div>
  );
}
