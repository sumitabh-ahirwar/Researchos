import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import AppLayout from "./layouts/AppLayout.jsx";
import ProtectedRoute from "./components/auth/ProtectedRoute.jsx";
import RouteFallback from "./components/shell/RouteFallback.jsx";

/**
 * Route table.
 *
 * The workspace is the only route that talks to the research API, so it is
 * eagerly reachable while everything else is code-split. Landing, auth, and
 * the report reader each pull in sizeable dependencies — the marketing
 * animations, the Markdown/highlighting stack — that most sessions never need
 * on first paint, so they load on demand behind a skeleton.
 */
const Landing = lazy(() => import("./pages/Landing.jsx"));
const Login = lazy(() => import("./pages/Login.jsx"));
const Signup = lazy(() => import("./pages/Signup.jsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));
const Workspace = lazy(() => import("./pages/Workspace.jsx"));
const History = lazy(() => import("./pages/History.jsx"));
const Saved = lazy(() => import("./pages/Saved.jsx"));
const ReportPage = lazy(() => import("./pages/ReportPage.jsx"));
const Settings = lazy(() => import("./pages/Settings.jsx"));
const Help = lazy(() => import("./pages/Help.jsx"));
const NotFound = lazy(() => import("./pages/NotFound.jsx"));

export default function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        {/* Marketing + auth */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Application shell — requires a session */}
        <Route element={<ProtectedRoute />}>
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="research" element={<Workspace />} />
            <Route path="history" element={<History />} />
            <Route path="saved" element={<Saved />} />
            <Route path="reports/:reportId" element={<ReportPage />} />
            <Route path="settings" element={<Settings />} />
            <Route path="help" element={<Help />} />
          </Route>
        </Route>

        {/* The pre-redesign entry point kept working. */}
        <Route path="/workspace" element={<Navigate to="/app/research" replace />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
