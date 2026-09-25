import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { authService } from "@/services/auth.service";
import type { AppRole, SessionData, UserProfile } from "@/types/auth";

export interface AuthState {
  user: UserProfile | null;
  roles: AppRole[];
  resellerId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasRole: (role: AppRole) => boolean;
  signIn: (identifier: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [resellerId, setResellerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const applySession = (data: SessionData) => {
    setUser(data.user);
    setRoles(data.roles);
    setResellerId(data.resellerId ?? null);
  };

  useEffect(() => {
    authService
      .me()
      .then(applySession)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const signIn = async (identifier: string, password: string) => {
    const isCpf = /^\d{11}$/.test(identifier);
    const body = isCpf ? { cpf: identifier, password } : { identifier, password };
    await authService.login(body);
    const data = await authService.me();
    applySession(data);
  };

  const signOut = async () => {
    await authService.logout().catch(() => {});
    setUser(null);
    setRoles([]);
    setResellerId(null);
  };

  const refresh = async () => {
    const data = await authService.me();
    applySession(data);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        roles,
        resellerId,
        isAuthenticated: !!user,
        isLoading,
        hasRole: (r) => roles.includes(r),
        signIn,
        signOut,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function useAuthUser() {
  const { user, roles, resellerId, isAuthenticated, isLoading } = useAuth();
  return {
    user,
    role: roles[0] ?? null,
    roles,
    reseller_id: resellerId,
    isAuthenticated,
    isLoading,
  };
}
