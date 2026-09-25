import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "@/integrations/api/client";

const MAX_RETRIES = 2;

/** Client errors (4xx) won't succeed on retry; network failures and 5xx might. */
function shouldRetry(failureCount: number, error: Error): boolean {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
  return failureCount < MAX_RETRIES;
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: shouldRetry,
        // Avoids refetching the same data on every mount/focus; polled queries set
        // their own `refetchInterval`/`staleTime`
        staleTime: 30_000,
      },
      mutations: {
        retry: false,
      },
    },
  });
}
