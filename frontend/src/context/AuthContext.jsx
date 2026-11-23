import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, TOKEN_KEY, USER_KEY } from "../lib/api";
import { ADMIN_ROLES } from "../lib/roles";

const AuthContext = createContext(null);

function readStoredUser() {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const user = JSON.parse(localStorage.getItem(USER_KEY) || "null");
    return token && user ? user : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [checking, setChecking] = useState(Boolean(readStoredUser()));

  const saveSession = useCallback((token, nextUser) => {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
  }, []);

  const updateUser = useCallback((nextUser) => {
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  // Confirm the stored session with the server once on load (role / disabled account may have changed)
  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) return;
    api("/api/auth/me")
      .then((data) => updateUser(data.user))
      .catch((error) => {
        if (error.status === 401 || error.status === 403) logout();
      })
      .finally(() => setChecking(false));
  }, [logout, updateUser]);

  // Expired token from any request, or logout in another tab
  useEffect(() => {
    const onExpired = () => logout();
    const onStorage = (e) => {
      if (e.key === TOKEN_KEY || e.key === USER_KEY) setUser(readStoredUser());
    };
    window.addEventListener("vyapaar:session-expired", onExpired);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("vyapaar:session-expired", onExpired);
      window.removeEventListener("storage", onStorage);
    };
  }, [logout]);

  const value = useMemo(() => {
    const role = user?.role;
    return {
      user,
      checking,
      isLoggedIn: Boolean(user),
      isAdmin: ADMIN_ROLES.includes(role),
      isSupplier: role === "supplier",
      isBuyer: role === "buyer" || role === "user",
      saveSession,
      updateUser,
      logout,
    };
  }, [user, checking, saveSession, updateUser, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
