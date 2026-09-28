import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { setUnauthorizedHandler } from "@/integrations/api/client";
import { authService } from "@/services/auth.service";
import { sessionKey, sessionQueryOptions } from "@/auth/session";
import type { AppRole, LoginPayload, SessionData, UserProfile } from "@/types/auth";

export interface AuthState {
  user: UserProfile | null;
  roles: AppRole[];
  resellerId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasRole: (role: AppRole) => boolean;
  /** Customers sign in with `{ cpf }`, staff with `{ identifier }` (their e-mail). */
  signIn: (payload: LoginPayload) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

const NO_ROLES: AppRole[] = [];

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const sessionQuery = useQuery(sessionQueryOptions);
  const session = sessionQuery.data ?? null;

  // Read synchronously by the 401 handler, which runs outside React renders
  const sessionRef = useRef<SessionData | null>(null);
  sessionRef.current = session;

  /**
   * Drops every cached query, so the next user never sees the previous one's data, then
   * stores `next`. The session query itself is kept (only updated) so `useQuery` above
   * stays subscribed to it and re-renders.
   */
  const resetCache = (next: SessionData | null) => {
    sessionRef.current = next;
    queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== sessionKey[0] });
    queryClient.getMutationCache().clear();
    queryClient.setQueryData(sessionKey, next);
  };

  useEffect(() => {
    setUnauthorizedHandler(() => {
      // Only a session that existed can expire; also dedupes parallel 401s
      if (!sessionRef.current) return;
      resetCache(null);
      toast.info("Sua sessão expirou. Entre novamente.");
      // Re-runs the route guards, which send the user to /login
      void router.invalidate();
    });
    return () => setUnauthorizedHandler(null);
    // resetCache only touches a ref and the stable queryClient
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const value = useMemo<AuthState>(() => {
    const roles = session?.roles ?? NO_ROLES;

    const signIn = async (payload: LoginPayload) => {
      await authService.login(payload);
      resetCache(await authService.me());
    };

    /** Callers navigate away afterwards (the guards would also redirect on the next load). */
    const signOut = async () => {
      await authService.logout().catch(() => {});
      resetCache(null);
    };

    return {
      user: session?.user ?? null,
      roles,
      resellerId: session?.resellerId ?? null,
      isAuthenticated: !!session,
      isLoading: sessionQuery.isPending,
      hasRole: (r) => roles.includes(r),
      signIn,
      signOut,
    };
    // resetCache only touches a ref and the stable queryClient
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, sessionQuery.isPending, queryClient]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
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
