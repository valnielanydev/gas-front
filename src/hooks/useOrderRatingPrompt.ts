import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { orderService } from "@/services/order.service";
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
  const [ratingSaving, setRatingSaving] = useState(false);

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

  const submitCustomerRating = async () => {
    if (!order?.id) return;
    setRatingSaving(true);
    try {
      const payload = await orderService.rate(order.id, {
        rating: ratingValue,
        comment: ratingComment,
        delivery_time_rating: deliveryTimeRatingValue,
      });
      if (payload.evaluator_role && payload.evaluator_role !== "customer") {
        toast.error("Avaliação recebida de um perfil diferente do esperado. Tente novamente.");
        return;
      }
      setOpen(false);
      toast.success("Avaliação salva com sucesso");
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar avaliação");
    } finally {
      setRatingSaving(false);
    }
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
