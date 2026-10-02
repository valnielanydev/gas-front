import { Link, useLocation } from "@tanstack/react-router";
import { House, ShoppingBag, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/customer", label: "Início", icon: House, exact: true },
  { to: "/customer/orders", label: "Pedidos", icon: ShoppingBag, exact: false },
  { to: "/customer/profile", label: "Perfil", icon: User, exact: false },
] as const;

export function CustomerBottomNav() {
  const location = useLocation();
  return (
    <nav
      className="pointer-events-auto fixed inset-x-0 bottom-0 z-500 grid grid-cols-3 border-t border-border bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/80 rounded-full mx-8 mb-4"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {items.map((it) => {
        const active = it.exact
          ? location.pathname === it.to
          : location.pathname === it.to || location.pathname.startsWith(it.to + "/");
        const Icon = it.icon;
        return (
          <Link
            key={it.to}
            to={it.to}
            className={cn(
              "flex min-h-14 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors",
              active ? "text-primary" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon
              className={cn("h-5 w-5", active && "text-primary")}
              strokeWidth={active ? 2.5 : 2}
            />
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
