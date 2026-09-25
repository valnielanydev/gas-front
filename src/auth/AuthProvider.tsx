import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { setUnauthorizedHandler } from "@/integrations/api/client";
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
  const queryClient = useQueryClient();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [resellerId, setResellerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Read synchronously by the 401 handler, which runs outside React renders
  const userRef = useRef<UserProfile | null>(null);

  const applySession = (data: SessionData) => {
    userRef.current = data.user;
    setUser(data.user);
    setRoles(data.roles);
    setResellerId(data.resellerId ?? null);
  };

  /** Forgets the user and every cached query, so the next user never sees their data. */
  const clearSession = () => {
    userRef.current = null;
    setUser(null);
    setRoles([]);
    setResellerId(null);
    queryClient.clear();
  };

  useEffect(() => {
    setUnauthorizedHandler(() => {
      // Only a session that existed can expire; also dedupes parallel 401s
      if (!userRef.current) return;
      clearSession();
      toast.info("Sua sessão expirou. Entre novamente.");
    });
    return () => setUnauthorizedHandler(null);
    // clearSession only touches refs, stable setters and the stable queryClient
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    queryClient.clear();
    applySession(data);
  };

  const signOut = async () => {
    await authService.logout().catch(() => {});
    clearSession();
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
