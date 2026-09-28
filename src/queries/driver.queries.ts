import { useMutation, useQuery } from "@tanstack/react-query";
import { driverService } from "@/services/driver.service";
import type { DriverSignupPayload, UpdateDriverProfilePayload } from "@/types/driver";
import { driverKeys } from "./keys";
import { useInvalidatingMutation, type MutationHookOptions } from "./mutation";
import { useOffsetPagination } from "./pagination";

export const DRIVER_DELIVERIES_PAGE_SIZE = 10;

/** Driver record of the logged-in user. */
export function useCurrentDriver(userId: string | undefined) {
  return useQuery({
    queryKey: driverKeys.self(userId),
    enabled: !!userId,
    queryFn: () => driverService.me(),
    retry: false,
  });
}

export function useDriverDashboardMetrics(userId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: driverKeys.selfDashboard(userId),
    enabled: !!userId && enabled,
    queryFn: () => driverService.dashboard(),
  });
}

export function useOrdersCustomerDetails(userId: string | undefined, orderIds: string[]) {
  return useQuery({
    queryKey: driverKeys.customerDetails(userId, orderIds),
    enabled: !!userId && orderIds.length > 0,
    queryFn: () => driverService.customerDetails(orderIds),
    placeholderData: (previous) => previous,
  });
}

export function useDriverDeliveries(userId: string | undefined) {
  return useOffsetPagination({
    queryKey: driverKeys.selfDeliveries(userId),
    enabled: !!userId,
    pageSize: DRIVER_DELIVERIES_PAGE_SIZE,
    fetchPage: (limit, offset) => driverService.deliveries(limit, offset),
  });
}

export function useMyDriverProfile(userId: string | undefined) {
  return useQuery({
    queryKey: driverKeys.selfProfile(userId),
    enabled: !!userId,
    queryFn: () => driverService.myProfile(),
  });
}

export function useUpdateMyDriverProfile(
  userId: string | undefined,
  options?: MutationHookOptions<unknown, UpdateDriverProfilePayload>,
) {
  return useInvalidatingMutation(
    (payload: UpdateDriverProfilePayload) => driverService.updateMyProfile(payload),
    () => [driverKeys.selfProfile(userId)],
    options,
  );
}

export function useDriverInvite(token: string) {
  return useQuery({
    queryKey: driverKeys.invite(token),
    enabled: !!token,
    queryFn: () => driverService.validateInvite(token),
    retry: false,
    staleTime: Infinity,
  });
}

/** Creates the driver account from a reseller's invite link. */
export function useDriverSignup(options?: MutationHookOptions<unknown, DriverSignupPayload>) {
  return useMutation({
    ...options,
    mutationFn: (payload: DriverSignupPayload) => driverService.signupWithInvite(payload),
  });
}
