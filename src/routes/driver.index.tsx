import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Truck } from "lucide-react";
import { toast } from "sonner";
import { useDriverDashboard } from "@/hooks/useDriverDashboard";
import { DriverBottomNav } from "@/components/layout/DriverBottomNav";
import { DriverNavigation } from "@/components/layout/DriverNavigation";
import { DriverDashboardCards } from "@/components/driver/DriverDashboardCards";
import { DriverApprovalNotice } from "@/components/driver/DriverApprovalNotice";
import { DriverHeader } from "@/components/driver/DriverHeader";
import { ActiveOrderCard } from "@/components/driver/ActiveOrderCard";
import { PendingOrdersSection } from "@/components/driver/PendingOrdersSection";
import { DeliveryCompleteDialog } from "@/components/driver/DeliveryCompleteDialog";
import { DeliveryRatingDrawer } from "@/components/driver/DeliveryRatingDrawer";
import { useRateOrder } from "@/queries/order.queries";

export const Route = createFileRoute("/driver/")({ component: DriverPage });

function DriverPage() {
  const d = useDriverDashboard();

  const [completeOpen, setCompleteOpen] = useState(false);
  const [code, setCode] = useState("");
  const [rateOpen, setRateOpen] = useState(false);
  const [ratingOrderId, setRatingOrderId] = useState<string | null>(null);
  const [ratingValue, setRatingValue] = useState<number>(5);
  const [ratingComment, setRatingComment] = useState("");

  const confirmComplete = async () => {
    const deliveredOrderId = await d.completeDelivery(code);
    if (!deliveredOrderId) return;
    setCompleteOpen(false);
    setCode("");
    setRatingOrderId(deliveredOrderId);
    setRateOpen(true);
  };

  const rateOrder = useRateOrder({
    onSuccess: () => {
      toast.success("Avaliação enviada");
      setRateOpen(false);
      setRatingOrderId(null);
      setRatingComment("");
      setRatingValue(5);
    },
    onError: (e) => toast.error(e.message || "Erro"),
  });
  const ratingSaving = rateOrder.isPending;

  const submitDriverRating = () => {
    if (!ratingOrderId) return;
    rateOrder.mutate({
      orderId: ratingOrderId,
      rating: ratingValue,
      comment: ratingComment,
      delivery_time_rating: null,
    });
  };

  if (d.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const { driver, active, isApproved, isOnline } = d;

  if (!driver) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <Truck className="h-12 w-12 text-muted-foreground" />
        <h1 className="text-xl font-semibold">Cadastro não encontrado</h1>
        <p className="text-sm text-muted-foreground">
          Sua conta não está vinculada a uma revendedora como motorista.
        </p>
        <p className="text-xs text-muted-foreground">
          Peça à revendedora um link de convite para se cadastrar como motorista.
        </p>
      </div>
    );
  }

  return (
    <DriverNavigation>
      <div className="min-h-screen bg-muted">
        <DriverHeader
          subtitle={d.headerSubtitle}
          isApproved={isApproved}
          isOnline={isOnline}
          toggleDisabled={d.togglingOnline || !!active}
          onToggleOnline={d.toggleOnline}
        />

        <main className="mx-auto max-w-2xl px-4 py-4 space-y-4">
          {isApproved && (
            <section className="space-y-2">
              <DriverDashboardCards
                loading={d.dashboardLoading}
                dashboard={d.dashboard}
                isOnline={isOnline}
                hasActiveOrder={!!active}
              />
            </section>
          )}

          {!isApproved && <DriverApprovalNotice status={driver.approval_status} />}

          {isApproved && active && (
            <ActiveOrderCard
              order={active}
              customerName={d.customerMap[active.id]?.customer_name ?? null}
              driverCoords={d.driverCoords}
              customerCoords={d.activeCustomerCoords}
              straightLineTrip={d.straightLineTrip}
              starting={d.starting}
              cancelling={d.cancelling}
              onStart={d.startDelivery}
              onOpenComplete={() => setCompleteOpen(true)}
              onCancel={d.cancelDelivery}
            />
          )}

          {isApproved && !active && (
            <PendingOrdersSection
              isOnline={isOnline}
              orders={d.available}
              customerMap={d.customerMap}
              distanceLabel={d.distanceLabel}
              selectedId={d.selectedPendingOrderId}
              onSelect={d.setSelectedPendingOrderId}
              acceptingId={d.acceptingId}
              onAccept={d.acceptOrder}
            />
          )}
        </main>

        <DriverBottomNav />

        <DeliveryCompleteDialog
          open={completeOpen}
          onOpenChange={setCompleteOpen}
          code={code}
          onCodeChange={setCode}
          onConfirm={confirmComplete}
          completing={d.completing}
        />

        <DeliveryRatingDrawer
          open={rateOpen}
          onOpenChange={setRateOpen}
          ratingValue={ratingValue}
          onRatingChange={setRatingValue}
          comment={ratingComment}
          onCommentChange={setRatingComment}
          saving={ratingSaving}
          onSubmit={submitDriverRating}
        />
      </div>
    </DriverNavigation>
  );
}
