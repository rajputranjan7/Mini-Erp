import React, { createContext, useContext, useEffect, useState } from "react";
import { AuthUser } from "../types";
import { authApi } from "../api/endpoints";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // On first load, restore the session from localStorage and verify the
  // token is still valid by pinging /auth/me.
  useEffect(() => {
    const stored = localStorage.getItem("erp_user");
    const token = localStorage.getItem("erp_token");

    if (stored && token) {
      setUser(JSON.parse(stored));
      authApi
        .me()
        .then((freshUser) => setUser(freshUser))
        .catch(() => {
          localStorage.removeItem("erp_token");
          localStorage.removeItem("erp_user");
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  async function login(email: string, password: string) {
    const { token, user: loggedInUser } = await authApi.login(email, password);
    localStorage.setItem("erp_token", token);
    localStorage.setItem("erp_user", JSON.stringify(loggedInUser));
    setUser(loggedInUser);
  }

  function logout() {
    localStorage.removeItem("erp_token");
    localStorage.removeItem("erp_user");
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
