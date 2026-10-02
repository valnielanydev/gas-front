import { useQuery } from "@tanstack/react-query";
import { isOrderFinished } from "@/lib/order-status";
import { customerService } from "@/services/customer.service";
import { orderService } from "@/services/order.service";
import type {
  CreateOrderPayload,
  DeliveryRating,
  EvaluatorRole,
  RatingPayload,
} from "@/types/order";
import { customerKeys, orderKeys } from "./keys";
import { useInvalidatingMutation, type MutationHookOptions } from "./mutation";

export function useOrderTracking(orderId: string, { enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: orderKeys.tracking(orderId),
    queryFn: () => orderService.tracking(orderId),
    enabled,
    // A delivered, cancelled or expired order won't change anymore: stop polling
    refetchInterval: (query) => {
      const status = query.state.data?.order.status;
      return status && isOrderFinished(status) ? false : 10_000;
    },
    retry: false,
  });
}

export function useRejectDriver(orderId: string, options?: MutationHookOptions<unknown, string>) {
  return useInvalidatingMutation(
    (reason: string) => orderService.rejectDriver(orderId, reason),
    () => [orderKeys.tracking(orderId)],
    options,
  );
}

export function useCancelOrder(orderId: string, options?: MutationHookOptions<unknown, void>) {
  return useInvalidatingMutation(
    () => orderService.cancel(orderId),
    () => [orderKeys.tracking(orderId)],
    options,
  );
}

/** Unblocks a driver from the order tracking screen and refreshes the tracking data. */
export function useUnblockDriverForOrder(
  orderId: string,
  options?: MutationHookOptions<unknown, string>,
) {
  return useInvalidatingMutation(
    (driverId: string) => customerService.unblockDriver(driverId),
    () => [orderKeys.tracking(orderId)],
    options,
  );
}

type RateOrderVariables = { orderId: string } & RatingPayload;

/**
 * Saves the logged-in user's rating of an order. When `expectedRole` is given, a rating
 * recorded under another role (e.g. a customer rating stored as the driver's) is treated
 * as a failure. Resolves with the rating as stored by the API.
 */
export function useRateOrder({
  expectedRole,
  ...options
}: MutationHookOptions<DeliveryRating, RateOrderVariables> & {
  expectedRole?: EvaluatorRole;
} = {}) {
  return useInvalidatingMutation(
    async ({ orderId, ...payload }: RateOrderVariables): Promise<DeliveryRating> => {
      const saved = await orderService.rate(orderId, payload);
      if (expectedRole && saved.evaluator_role && saved.evaluator_role !== expectedRole) {
        throw new Error("Avaliação recebida de um perfil diferente do esperado. Tente novamente.");
      }
      return {
        rating: Number(saved.rating),
        comment: saved.comment ?? null,
        delivery_time_rating: saved.delivery_time_rating ?? null,
      };
    },
    ({ orderId }) => [
      orderKeys.tracking(orderId),
      orderKeys.detail(orderId),
      [...customerKeys.all],
    ],
    options,
  );
}

/** Places an order; refreshes the customer's active order, history and last address. */
export function useCreateOrder(options?: MutationHookOptions<{ id: string }, CreateOrderPayload>) {
  return useInvalidatingMutation(
    (payload: CreateOrderPayload) => orderService.create(payload),
    () => [[...customerKeys.all]],
    options,
  );
}
