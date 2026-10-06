
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { apiGet } from "../services/api";
import { sessionStorage } from "../utils/session";
import type { Role, User } from "../types";

interface AuthContextValue {
  user: User | null;
  role: Role | null;
  token: string | null;
  loading: boolean;
  isAdmin: boolean;
  isManager: boolean;
  hasPermission: (permission: string) => boolean;
  setSession: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const USER_KEY = "petrosoft_user";
const TOKEN_KEY = "petrosoft_token";

const readUser = (): User | null => {
  try {
    const raw = sessionStorage.get(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => sessionStorage.get(TOKEN_KEY));
  const [user, setUser] = useState<User | null>(() => readUser());
  const [loading, setLoading] = useState(Boolean(sessionStorage.get(TOKEN_KEY)));

  useEffect(() => {
    const currentToken = sessionStorage.get(TOKEN_KEY);
    if (!currentToken) {
      setLoading(false);
      return;
    }

    apiGet<{ success: boolean; data: { userId: string; accountId: string; roleId: string; role: Role; email: string } }>("/auth/me")
      .then((response) => {
        const me = response?.data ?? response;

        if (!me || !me.role) {
          throw new Error("AUTH_ME_INVALID");
        }

        setUser((previous) => ({
          id: me.userId,
          name: previous?.name || me.email.split("@")[0],
          email: me.email,
          role: me.role,
          permissions: previous?.permissions || [],
        }));
      })
      .catch(() => {
        sessionStorage.remove(TOKEN_KEY);
        sessionStorage.remove(USER_KEY);
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const setSession = (newToken: string, newUser: User) => {
    sessionStorage.set(TOKEN_KEY, newToken);
    sessionStorage.set(USER_KEY, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    sessionStorage.remove(TOKEN_KEY);
    sessionStorage.remove(USER_KEY);
    sessionStorage.remove("petrosoft_remember");
    setToken(null);
    setUser(null);
  };

  const value = useMemo<AuthContextValue>(() => ({
    user,
    role: user?.role ?? null,
    token,
    loading,
    isAdmin: user?.role === "ADMIN",
    isManager: user?.role === "MANAGER",
    hasPermission: (permission) => user?.role === "ADMIN" || Boolean(user?.permissions?.includes(permission)),
    setSession,
    logout,
  }), [user, token, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
