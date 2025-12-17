import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getProfile, login as loginApi, logout as logoutApi } from "../api/auth.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("enginy:token"));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const profile = await getProfile(token);
        setUser(profile);
      } catch (error) {
        console.error("Failed to restore session", error);
        setToken(null);
        localStorage.removeItem("enginy:token");
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, [token]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { user: loggedUser, token: newToken } = await loginApi(email, password);
      setUser(loggedUser);
      setToken(newToken);
      localStorage.setItem("enginy:token", newToken);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    logoutApi();
    setUser(null);
    setToken(null);
    localStorage.removeItem("enginy:token");
  };

  const value = useMemo(
    () => ({ user, token, loading, login, logout, isAuthenticated: Boolean(user && token) }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
