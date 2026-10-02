import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/services/admin.service";
import type { AdminReseller, ResellerPayload } from "@/types/admin";
import { adminKeys } from "./keys";
import { useInvalidatingMutation, type MutationHookOptions } from "./mutation";

export function useMasterStats() {
  return useQuery({ queryKey: adminKeys.stats(), queryFn: () => adminService.stats() });
}

export function useAdminOrders(limit = 100) {
  return useQuery({ queryKey: adminKeys.orders(limit), queryFn: () => adminService.orders(limit) });
}

export function useAdminUsers() {
  return useQuery({ queryKey: adminKeys.users(), queryFn: () => adminService.users() });
}

export function useAdminResellers(params: { active?: boolean } = {}) {
  return useQuery({
    queryKey: adminKeys.resellerList(params),
    queryFn: () => adminService.resellers(params),
  });
}

type SaveResellerVariables = { id: string | null; payload: ResellerPayload };

/** Creates the reseller when `id` is null, otherwise updates it. */
export function useSaveReseller(
  options?: MutationHookOptions<
    Awaited<ReturnType<typeof adminService.createReseller>> | null,
    SaveResellerVariables
  >,
) {
  return useInvalidatingMutation(
    ({ id, payload }: SaveResellerVariables) =>
      id ? adminService.updateReseller(id, payload) : adminService.createReseller(payload),
    () => [adminKeys.resellers()],
    options,
  );
}

export function useToggleResellerActive(options?: MutationHookOptions<null, AdminReseller>) {
  return useInvalidatingMutation(
    (r: AdminReseller) => adminService.updateReseller(r.id, { is_active: !r.is_active }),
    () => [adminKeys.resellers()],
    options,
  );
}

export function useDeleteReseller(options?: MutationHookOptions<unknown, string>) {
  return useInvalidatingMutation(
    (id: string) => adminService.deleteReseller(id),
    () => [adminKeys.resellers(), adminKeys.users()],
    options,
  );
}

export function usePromoteToMaster(options?: MutationHookOptions<unknown, string>) {
  return useInvalidatingMutation(
    (userId: string) => adminService.promoteToMaster(userId),
    () => [adminKeys.users()],
    options,
  );
}

export function useDemoteFromMaster(options?: MutationHookOptions<unknown, string>) {
  return useInvalidatingMutation(
    (userId: string) => adminService.demoteFromMaster(userId),
    () => [adminKeys.users()],
    options,
  );
}

type LinkUserVariables = {
  userId: string;
  resellerId: string;
  role: "reseller_admin" | "driver";
};

export function useLinkUserToReseller(options?: MutationHookOptions<unknown, LinkUserVariables>) {
  return useInvalidatingMutation(
    ({ userId, resellerId, role }: LinkUserVariables) =>
      adminService.linkUserToReseller(userId, resellerId, role),
    () => [adminKeys.users()],
    options,
  );
}
