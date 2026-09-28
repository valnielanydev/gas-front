import { useMutation } from "@tanstack/react-query";
import { authService } from "@/services/auth.service";
import type { MutationHookOptions } from "./mutation";

type ChangePasswordVariables = { currentPassword: string; newPassword: string };

/** Fails with a 401 `ApiError` when the current password is wrong. */
export function useChangePassword(options?: MutationHookOptions<unknown, ChangePasswordVariables>) {
  return useMutation({
    ...options,
    mutationFn: ({ currentPassword, newPassword }: ChangePasswordVariables) =>
      authService.changePassword(currentPassword, newPassword),
  });
}

type ResetPasswordVariables = { token: string; password: string };

export function useResetPassword(options?: MutationHookOptions<unknown, ResetPasswordVariables>) {
  return useMutation({
    ...options,
    mutationFn: ({ token, password }: ResetPasswordVariables) =>
      authService.resetPassword(token, password),
  });
}
