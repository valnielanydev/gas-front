import {
  useMutation,
  useQueryClient,
  type QueryKey,
  type UseMutationOptions,
} from "@tanstack/react-query";

export type MutationHookOptions<TData, TVariables> = Omit<
  UseMutationOptions<TData, Error, TVariables>,
  "mutationFn"
>;

/**
 * `useMutation` that invalidates the given query keys on success, before running the
 * caller's own `onSuccess`. Keeps cache invalidation next to the request instead of in
 * every component that triggers it.
 */
export function useInvalidatingMutation<TData, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  keysToInvalidate: (variables: TVariables) => QueryKey[],
  options?: MutationHookOptions<TData, TVariables>,
) {
  const qc = useQueryClient();
  return useMutation({
    ...options,
    mutationFn,
    onSuccess: (data, variables, onMutateResult, context) => {
      for (const queryKey of keysToInvalidate(variables)) {
        void qc.invalidateQueries({ queryKey });
      }
      return options?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}
