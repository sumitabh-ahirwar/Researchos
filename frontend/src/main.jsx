import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App.jsx";
import ErrorBoundary from "./components/shell/ErrorBoundary.jsx";
import { ThemeProvider } from "./hooks/useTheme.jsx";
import { ToastProvider } from "./components/ui/Toast.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { WorkspaceProvider } from "./context/WorkspaceContext.jsx";
import "./index.css";

/**
 * Provider order matters:
 *   ErrorBoundary     — catches render failures from everything below it
 *   ThemeProvider     — sets data-theme before children paint
 *   BrowserRouter     — consumers below use Link/useNavigate
 *   ToastProvider     — portals notifications, needs no router context itself
 *   AuthProvider      — owns the session; WorkspaceProvider reads the user from it
 *   WorkspaceProvider — shared report library and display profile
 */
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <BrowserRouter>
          <ToastProvider>
            <AuthProvider>
              <WorkspaceProvider>
                <App />
              </WorkspaceProvider>
            </AuthProvider>
          </ToastProvider>
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
