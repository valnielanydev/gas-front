import { createRouter, useRouter } from "@tanstack/react-router";
import { ErrorFallback } from "@/components/common/ErrorFallback";
import { createQueryClient } from "@/queries/client";
import { routeTree } from "./routeTree.gen";

function DefaultErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();

  return (
    <ErrorFallback
      error={error}
      // The router catches route errors itself, so Sentry's ErrorBoundary never sees them
      report
      onRetry={() => {
        void router.invalidate();
        reset();
      }}
    />
  );
}

export const getRouter = () => {
  const router = createRouter({
    routeTree,
    // One client per router: per request on the server, once in the browser
    context: { queryClient: createQueryClient() },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultErrorComponent: DefaultErrorComponent,
  });

  return router;
};
