import { useQuery } from "@tanstack/react-query";
import { orderService } from "@/services/order.service";
import { resellerService } from "@/services/reseller.service";
import type { DriverApprovalStatus, ResellerDriver, UpdateDriverPayload } from "@/types/driver";
import type { UpsertProductPayload } from "@/types/reseller";
import { driverKeys, resellerKeys } from "./keys";
import { useInvalidatingMutation, type MutationHookOptions } from "./mutation";

export function useResellerStats(resellerId: string | null) {
  return useQuery({
    queryKey: resellerKeys.stats(resellerId),
    enabled: !!resellerId,
    queryFn: () => resellerService.stats(resellerId!),
  });
}

export function useResellerOrders(resellerId: string | null) {
  return useQuery({
    queryKey: resellerKeys.orders(resellerId),
    enabled: !!resellerId,
    queryFn: () => resellerService.orders(resellerId!),
  });
}

export function useResellerProducts(
  resellerId: string | null,
  { retry }: { retry?: boolean | number } = {},
) {
  return useQuery({
    queryKey: resellerKeys.products(resellerId),
    enabled: !!resellerId,
    queryFn: () => resellerService.products(resellerId!),
    retry,
  });
}

export function useResellerDrivers(resellerId: string | null) {
  return useQuery({
    queryKey: resellerKeys.drivers(resellerId),
    enabled: !!resellerId,
    queryFn: () => resellerService.drivers(resellerId!),
  });
}

export function useDriverHistory(driverId: string | undefined) {
  return useQuery({
    queryKey: driverKeys.history(driverId),
    enabled: !!driverId,
    queryFn: () => resellerService.driverHistory(driverId!),
  });
}

type UpdateOrderStatusVariables = { id: string; status: string };

export function useUpdateResellerOrderStatus(
  resellerId: string | null,
  options?: MutationHookOptions<unknown, UpdateOrderStatusVariables>,
) {
  return useInvalidatingMutation(
    ({ id, status }: UpdateOrderStatusVariables) => orderService.updateStatus(id, status),
    () => [resellerKeys.orders(resellerId), resellerKeys.stats(resellerId)],
    options,
  );
}

type SaveProductVariables = { id: string | null; payload: UpsertProductPayload };

/** Creates the product when `id` is null, otherwise updates it. */
export function useSaveProduct(
  resellerId: string | null,
  options?: MutationHookOptions<unknown, SaveProductVariables>,
) {
  return useInvalidatingMutation(
    ({ id, payload }: SaveProductVariables) =>
      id
        ? resellerService.updateProduct(id, payload)
        : resellerService.createProduct(resellerId!, payload),
    () => [resellerKeys.products(resellerId), resellerKeys.stats(resellerId)],
    options,
  );
}

export function useDeleteProduct(
  resellerId: string | null,
  options?: MutationHookOptions<unknown, string>,
) {
  return useInvalidatingMutation(
    (id: string) => resellerService.deleteProduct(id),
    () => [resellerKeys.products(resellerId), resellerKeys.stats(resellerId)],
    options,
  );
}

type UpdateDriverStatusVariables = { d: ResellerDriver; status: DriverApprovalStatus };

export function useUpdateDriverStatus(
  resellerId: string | null,
  options?: MutationHookOptions<unknown, UpdateDriverStatusVariables>,
) {
  return useInvalidatingMutation(
    ({ d, status }: UpdateDriverStatusVariables) =>
      resellerService.updateDriverStatus(d.id, status),
    () => [resellerKeys.drivers(resellerId), resellerKeys.stats(resellerId)],
    options,
  );
}

type UpdateDriverVariables = { id: string; payload: UpdateDriverPayload };

export function useUpdateDriver(
  resellerId: string | null,
  options?: MutationHookOptions<unknown, UpdateDriverVariables>,
) {
  return useInvalidatingMutation(
    ({ id, payload }: UpdateDriverVariables) => resellerService.updateDriver(id, payload),
    () => [resellerKeys.drivers(resellerId)],
    options,
  );
}

type RemoveDriverVariables = { id: string; deleteAccount: boolean };

export function useRemoveDriver(
  resellerId: string | null,
  options?: MutationHookOptions<unknown, RemoveDriverVariables>,
) {
  return useInvalidatingMutation(
    ({ id, deleteAccount }: RemoveDriverVariables) =>
      resellerService.removeDriver(id, deleteAccount),
    () => [resellerKeys.drivers(resellerId), resellerKeys.stats(resellerId)],
    options,
  );
}
