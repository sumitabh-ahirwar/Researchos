import { Navigate, Outlet, useLocation } from "react-router-dom";

import RouteFallback from "../shell/RouteFallback.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

/**
 * Gate for the authenticated shell.
 *
 * While the session check is in flight it renders the same skeleton the router
 * uses, so an authenticated user reloading a deep link never sees the login
 * page flash before their session resolves.
 *
 * The attempted path is passed to /login in router state so signing in returns
 * the user where they were headed instead of dumping them on the dashboard.
 *
 * This is a UX gate, not a security boundary — the API authorises every request
 * on its own. Anything genuinely protected must be enforced server-side.
 */
export default function ProtectedRoute() {
  const { isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (isLoading) return <RouteFallback />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  return <Outlet />;
}
