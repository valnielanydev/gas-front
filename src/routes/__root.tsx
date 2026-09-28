import {
  Outlet,
  Link,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
  useLocation,
} from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { Toaster } from "sonner";
import { AuthProvider } from "@/auth/AuthProvider";
import { ErrorFallback } from "@/components/common/ErrorFallback";
import { env } from "@/lib/env";
import { initSentry, Sentry } from "@/lib/sentry";
import { reportWebVitals } from "@/lib/vitals";
import { themeInitScript } from "@/lib/theme";
import type { RouterContext } from "@/router-context";

initSentry();

import appCss from "../styles.css?url";

/** Served from `public/`; absolute when the site URL is known, as crawlers require. */
const OG_IMAGE_URL = `${env.VITE_SITE_URL ?? ""}/og-image.webp`;

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A página que você procura não existe ou foi movida.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Ir para o início
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "VaptGás — Plataforma de Entrega de Gás" },
      {
        name: "description",
        content:
          "Plataforma multi-tenant para revendedoras de gás conectarem motoristas e clientes finais.",
      },
      { property: "og:title", content: "VaptGás — Plataforma de Entrega de Gás" },
      { name: "twitter:title", content: "VaptGás — Plataforma de Entrega de Gás" },
      {
        property: "og:description",
        content:
          "VaptGás conecta revendedoras, motoristas e clientes em uma plataforma de entregas de gás.",
      },
      {
        name: "twitter:description",
        content:
          "VaptGás conecta revendedoras, motoristas e clientes em uma plataforma de entregas de gás.",
      },
      { property: "og:image", content: OG_IMAGE_URL },
      { name: "twitter:image", content: OG_IMAGE_URL },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    // The theme script sets the `dark` class before hydration
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  useEffect(() => {
    reportWebVitals();
  }, []);
  return (
    <Sentry.ErrorBoundary
      fallback={({ error, resetError }) => <ErrorFallback error={error} onRetry={resetError} />}
    >
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {import.meta.env.DEV && <RouteChangeLogger />}
          <Outlet />
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </QueryClientProvider>
    </Sentry.ErrorBoundary>
  );
}

function RouteChangeLogger() {
  const location = useLocation();
  useEffect(() => {
    console.debug("[routing] route changed", {
      pathname: location.pathname,
      search: location.searchStr,
    });
  }, [location.pathname, location.searchStr]);
  return null;
}
