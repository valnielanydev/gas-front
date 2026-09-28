import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useRateOrder } from "@/queries/order.queries";
import type { DeliveryRating, FullOrder } from "@/types/order";

/**
 * Customer rating drawer for a delivered order. Opens once per browser session when the
 * order is delivered and not rated yet; `onDone` runs after submitting or skipping.
 */
export function useOrderRatingPrompt(
  orderId: string,
  order: FullOrder | null,
  customerRating: DeliveryRating | null,
  onDone: () => void,
) {
  const [open, setOpen] = useState(false);
  const [ratingValue, setRatingValue] = useState(5);
  const [deliveryTimeRatingValue, setDeliveryTimeRatingValue] = useState(5);
  const [ratingComment, setRatingComment] = useState("");

  const ratingModalStorageKey = useMemo(
    () => `customer-rating-modal-opened:${order?.id ?? orderId}`,
    [order?.id, orderId],
  );

  useEffect(() => {
    if (!order || order.status !== "delivered" || customerRating) return;
    const alreadyOpened = window.sessionStorage.getItem(ratingModalStorageKey) === "1";
    if (alreadyOpened) return;
    setOpen(true);
    window.sessionStorage.setItem(ratingModalStorageKey, "1");
  }, [order, customerRating, ratingModalStorageKey]);

  const rateOrder = useRateOrder({
    expectedRole: "customer",
    onSuccess: () => {
      setOpen(false);
      toast.success("Avaliação salva com sucesso");
      onDone();
    },
    onError: (err) => toast.error(err.message || "Erro ao salvar avaliação"),
  });
  const ratingSaving = rateOrder.isPending;

  const submitCustomerRating = () => {
    if (!order?.id) return;
    rateOrder.mutate({
      orderId: order.id,
      rating: ratingValue,
      comment: ratingComment,
      delivery_time_rating: deliveryTimeRatingValue,
    });
  };

  const skipCustomerRating = () => {
    setOpen(false);
    onDone();
  };

  return {
    open,
    onOpenChange: setOpen,
    ratingValue,
    onRatingChange: setRatingValue,
    deliveryTimeRatingValue,
    onDeliveryTimeRatingChange: setDeliveryTimeRatingValue,
    comment: ratingComment,
    onCommentChange: setRatingComment,
    saving: ratingSaving,
    onSubmit: submitCustomerRating,
    onSkip: skipCustomerRating,
  };
}
