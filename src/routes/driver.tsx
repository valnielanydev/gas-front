import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { RequireRole } from "@/auth/RequireRole";

export const Route = createFileRoute("/driver")({
  component: DriverArea,
});

/** Invite sign-up is used before the driver has an account, so it stays public. */
const PUBLIC_PATHS = new Set(["/driver/signup"]);

function DriverArea() {
  const { pathname } = useLocation();
  if (PUBLIC_PATHS.has(pathname.replace(/\/$/, ""))) return <Outlet />;

  return (
    <RequireRole role="driver">
      <Outlet />
    </RequireRole>
  );
}
