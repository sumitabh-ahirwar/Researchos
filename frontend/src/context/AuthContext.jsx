import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import * as authApi from "../api/authApi.js";

const AuthContext = createContext(null);

/**
 * Authentication state.
 *
 * The session is an httpOnly cookie, so the client cannot inspect it directly —
 * it asks the API who it is on mount instead. `status` distinguishes "still
 * checking" from "definitely signed out", which matters because guarding routes
 * on `user === null` alone would bounce an authenticated user to the login page
 * for the duration of that first request.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading");
  const [bootstrapError, setBootstrapError] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const current = await authApi.fetchCurrentUser();
        if (cancelled) return;
        setUser(current);
        setStatus(current ? "authenticated" : "anonymous");
      } catch (error) {
        // Reaching here means the API is unreachable, not that the user is
        // signed out. Surface it so the UI can say so rather than silently
        // presenting a login form that cannot possibly succeed.
        if (cancelled) return;
        setBootstrapError(error.message);
        setStatus("anonymous");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (credentials) => {
    const data = await authApi.login(credentials);
    setUser(data.user);
    setStatus("authenticated");
    return data.user;
  }, []);

  const signup = useCallback(async (details) => {
    const data = await authApi.signup(details);
    setUser(data.user);
    setStatus("authenticated");
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      // Clear locally even if the request failed — the user asked to sign out,
      // and leaving them looking signed in would be worse than a stale cookie.
      setUser(null);
      setStatus("anonymous");
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      status,
      bootstrapError,
      isAuthenticated: status === "authenticated",
      isLoading: status === "loading",
      login,
      signup,
      logout,
    }),
    [user, status, bootstrapError, login, signup, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside an <AuthProvider>.");
  return context;
}
