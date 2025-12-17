import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getProfile, login as loginApi, logout as logoutApi } from "../api/auth.js";

const AuthContext = createContext(null);

// Clave consistente para localStorage
const TOKEN_KEY = "enginy_token";
const USER_KEY = "enginy_user";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem(USER_KEY);
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const profile = await getProfile(token);
        setUser(profile);
        localStorage.setItem(USER_KEY, JSON.stringify(profile));
      } catch (error) {
        console.error("Failed to restore session", error);
        setToken(null);
        setUser(null);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
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
      localStorage.setItem(TOKEN_KEY, newToken);
      localStorage.setItem(USER_KEY, JSON.stringify(loggedUser));
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    logoutApi();
    setUser(null);
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
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

export { AuthContext };
