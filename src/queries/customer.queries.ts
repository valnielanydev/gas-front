import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sessionKey } from "@/auth/session";
import { customerService } from "@/services/customer.service";
import { orderService } from "@/services/order.service";
import { customerKeys, orderKeys } from "./keys";
import { useInvalidatingMutation, type MutationHookOptions } from "./mutation";
import { useOffsetPagination } from "./pagination";
import type { UpdateCustomerProfilePayload } from "@/types/customer";

export const CUSTOMER_ORDERS_PAGE_SIZE = 10;

export function useCustomerActiveOrder(userId: string | undefined) {
  return useQuery({
    queryKey: customerKeys.activeOrder(userId),
    enabled: !!userId,
    queryFn: () => customerService.activeOrder(),
    // Changes outside this screen (order placed, delivered, cancelled): always revalidate
    staleTime: 0,
  });
}

export function useLastDeliveryAddress(userId: string | undefined) {
  return useQuery({
    queryKey: customerKeys.lastDeliveryAddress(userId),
    enabled: !!userId,
    queryFn: () => customerService.lastDeliveryAddress(),
    select: (data) =>
      data?.delivery_address
        ? {
            address: data.delivery_address,
            lat: data.delivery_latitude != null ? Number(data.delivery_latitude) : null,
            lng: data.delivery_longitude != null ? Number(data.delivery_longitude) : null,
          }
        : null,
  });
}

export function useCustomerOrders(userId: string | undefined) {
  return useOffsetPagination({
    queryKey: customerKeys.orders(userId),
    enabled: !!userId,
    pageSize: CUSTOMER_ORDERS_PAGE_SIZE,
    fetchPage: (limit, offset) => customerService.listOrders(limit, offset),
  });
}

/** The customer's own rating of each given (delivered) order. */
export function useCustomerRatings(userId: string | undefined, orderIds: string[]) {
  return useQuery({
    queryKey: customerKeys.ratings(userId, orderIds),
    enabled: !!userId && orderIds.length > 0,
    queryFn: () => customerService.ratingsForOrders(orderIds),
    placeholderData: (previous) => previous,
  });
}

/** Average rating of the driver who handled each given order. */
export function useDriverMetricsForOrders(userId: string | undefined, orderIds: string[]) {
  return useQuery({
    queryKey: customerKeys.driverMetrics(userId, orderIds),
    enabled: !!userId && orderIds.length > 0,
    queryFn: () => customerService.driverMetricsForOrders(orderIds),
    placeholderData: (previous) => previous,
  });
}

export function useOrderDetail(orderId: string | null) {
  return useQuery({
    queryKey: orderKeys.detail(orderId ?? ""),
    enabled: !!orderId,
    queryFn: () => orderService.detail(orderId!),
    retry: false,
  });
}

export function useBlockedDrivers(userId: string | undefined) {
  return useQuery({
    queryKey: customerKeys.blockedDrivers(userId),
    enabled: !!userId,
    queryFn: () => customerService.listBlockedDrivers(),
  });
}

export function useUnblockDriver(
  userId: string | undefined,
  options?: MutationHookOptions<unknown, string>,
) {
  return useInvalidatingMutation(
    (driverId: string) => customerService.unblockDriver(driverId),
    () => [customerKeys.blockedDrivers(userId), orderKeys.all],
    options,
  );
}

/**
 * Updates the customer's name/phone. Resolves only after the session (which carries the
 * user profile) is refetched, so the next screen already shows the new data.
 */
export function useUpdateCustomerProfile(
  options?: MutationHookOptions<void, UpdateCustomerProfilePayload>,
) {
  const qc = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: async (payload: UpdateCustomerProfilePayload) => {
      await customerService.updateProfile(payload);
      await qc.invalidateQueries({ queryKey: sessionKey });
    },
  });
}
