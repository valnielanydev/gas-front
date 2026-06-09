import { Link, useLocation } from "@tanstack/react-router";
import { Home, Package, User } from "lucide-react";

const items = [
  { to: "/driver", label: "Início", icon: Home, exact: true },
  { to: "/driver/deliveries", label: "Pedidos", icon: Package, exact: false },
  { to: "/driver/profile", label: "Perfil", icon: User, exact: false },
];

export function DriverBottomNav() {
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-20 grid grid-cols-3 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {items.map((item) => {
        const active = item.exact
          ? location.pathname === item.to
          : location.pathname === item.to || location.pathname.startsWith(item.to + "/");
        return (
          <Link
            key={item.to}
            to={item.to}
            className={`flex min-h-14 flex-col items-center justify-center gap-1 py-2 text-xs font-medium transition-colors ${
              active ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <item.icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
