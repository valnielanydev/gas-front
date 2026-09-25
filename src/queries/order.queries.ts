import { useQuery } from "@tanstack/react-query";
import { customerService } from "@/services/customer.service";
import { orderService } from "@/services/order.service";
import { orderKeys } from "./keys";
import { useInvalidatingMutation, type MutationHookOptions } from "./mutation";

export function useOrderTracking(orderId: string, { enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: orderKeys.tracking(orderId),
    queryFn: () => orderService.tracking(orderId),
    enabled,
    refetchInterval: 10_000,
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
