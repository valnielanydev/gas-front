import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { Flame, LogOut, Loader2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth, type AppRole } from "@/auth/AuthProvider";
import { ChangePasswordDialog } from "@/components/ChangePasswordDialog";
import { ThemeToggle } from "@/components/ThemeToggle";

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface DashboardLayoutProps {
  title: string;
  navItems: NavItem[];
  children: ReactNode;
  requiredRole: AppRole;
}

export function DashboardLayout({ title, navItems, children, requiredRole }: DashboardLayoutProps) {
  const { isAuthenticated, isLoading, hasRole, signOut, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      navigate({ to: "/login", replace: true });
    } else if (!hasRole(requiredRole)) {
      navigate({ to: "/", replace: true });
    }
  }, [isAuthenticated, isLoading, hasRole, requiredRole, navigate]);

  if (isLoading || !isAuthenticated || !hasRole(requiredRole)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  return (
    <div className="flex min-h-screen bg-muted">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Flame className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-bold leading-tight">VaptGás</div>
            <div className="text-xs text-sidebar-foreground/60">{title}</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <div className="mb-2 px-3 text-xs text-sidebar-foreground/60 truncate">{user?.email}</div>
          <div className="mb-1">
            <ThemeToggle
              variant="full"
              className="bg-transparent border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            />
          </div>
          <ChangePasswordDialog />
          <Button
            onClick={handleLogout}
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 md:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Flame className="h-4 w-4" />
            </div>
            <span className="font-bold">VaptGás</span>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <ChangePasswordDialog
              trigger={
                <Button variant="ghost" size="icon" aria-label="Alterar senha">
                  <KeyRound className="h-4 w-4" />
                </Button>
              }
            />
            <Button onClick={handleLogout} variant="ghost" size="sm" aria-label="Sair">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Mobile bottom nav */}
        <nav className="fixed bottom-0 left-0 right-0 z-10 grid grid-cols-4 border-t border-border bg-card md:hidden">
          {navItems.slice(0, 4).map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center gap-1 py-2 text-xs ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <main className="flex-1 overflow-y-auto px-4 py-6 pb-20 md:px-8 md:pb-6">{children}</main>
      </div>
    </div>
  );
}
