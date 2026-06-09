import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "@/integrations/api/client";

export type AppRole = "master" | "reseller_admin" | "driver" | "customer";

export interface UserProfile {
  id: string;
  fullName: string;
  email?: string;
  cpf?: string;
  phone?: string;
  address?: string | null;
}

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

interface SessionData {
  user: UserProfile;
  roles: AppRole[];
  resellerId?: string | null;
}

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
    api
      .get<SessionData>("/auth/me")
      .then(applySession)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const signIn = async (identifier: string, password: string) => {
    const data = await api.post<SessionData>("/auth/login", { identifier, password });
    applySession(data);
  };

  const signOut = async () => {
    await api.post("/auth/logout").catch(() => {});
    setUser(null);
    setRoles([]);
    setResellerId(null);
  };

  const refresh = async () => {
    const data = await api.get<SessionData>("/auth/me");
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
