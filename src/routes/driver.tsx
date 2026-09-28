import { createFileRoute, Outlet } from "@tanstack/react-router";
import { requireRole } from "@/auth/guard";
import { FullScreenLoader } from "@/components/common/FullScreenLoader";

export const Route = createFileRoute("/driver")({
  // Auth lives in the API's cookie, which the SSR server can't see: guard in the browser
  ssr: false,
  beforeLoad: requireRole("driver"),
  // Rendered by SSR and while the guard checks the session
  pendingComponent: FullScreenLoader,
  component: Outlet,
});
