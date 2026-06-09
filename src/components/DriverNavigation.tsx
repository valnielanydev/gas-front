import { Link, useLocation } from "@tanstack/react-router";
import { Home, Package, User } from "lucide-react";

const items = [
  { to: "/driver", label: "Início", icon: Home, exact: true },
  { to: "/driver/deliveries", label: "Pedidos", icon: Package, exact: false },
  { to: "/driver/profile", label: "Perfil", icon: User, exact: false },
];

export function DriverNavigation({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-muted md:grid md:grid-cols-[220px_1fr]">
      <aside className="hidden border-r bg-card md:block">
        <div className="p-4 text-sm font-semibold">Menu do motorista</div>
        <nav className="space-y-1 px-2 pb-4">
          {items.map((item) => {
            const active = item.exact
              ? location.pathname === item.to
              : location.pathname === item.to || location.pathname.startsWith(item.to + "/");
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${
                  active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="pb-20 md:pb-0">{children}</div>
    </div>
  );
}
