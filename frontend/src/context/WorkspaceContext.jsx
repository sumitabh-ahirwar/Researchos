import { createContext, useContext, useMemo } from "react";

import useReportLibrary from "../hooks/useReportLibrary.js";
import useLocalStorage from "../hooks/useLocalStorage.js";
import { useAuth } from "./AuthContext.jsx";

const WorkspaceContext = createContext(null);

/**
 * Shared workspace state for the authenticated shell.
 *
 * The report library and the notification feed are read by the sidebar, the
 * topbar, and several pages at once, so they are lifted here instead of being
 * re-instantiated per route — two `useReportLibrary` calls would each hold
 * their own copy of the same localStorage array and drift apart.
 *
 * `profile` reflects the signed-in account when there is one, falling back to a
 * local placeholder so the shell still renders during the initial session
 * check. The account itself is owned by AuthContext — this is only the display
 * projection the sidebar, topbar, and greeting read.
 */
export function WorkspaceProvider({ children }) {
  const library = useReportLibrary();
  const { user } = useAuth();
  const [localProfile, setProfile] = useLocalStorage("researchos:profile", {
    name: "Researcher",
    email: "",
  });
  const [notifications, setNotifications] = useLocalStorage("researchos:notifications", []);

  const profile = useMemo(
    () => (user ? { name: user.name, email: user.email, id: user.id } : localProfile),
    [user, localProfile],
  );

  const value = useMemo(
    () => ({
      library,
      profile,
      setProfile,
      notifications,
      setNotifications,
      pushNotification: (entry) =>
        setNotifications((current) =>
          [
            {
              id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              createdAt: new Date().toISOString(),
              read: false,
              ...entry,
            },
            ...current,
          ].slice(0, 25),
        ),
      markAllRead: () =>
        setNotifications((current) => current.map((entry) => ({ ...entry, read: true }))),
      clearNotifications: () => setNotifications([]),
    }),
    [library, profile, setProfile, notifications, setNotifications],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error("useWorkspace must be used inside a <WorkspaceProvider>.");
  return context;
}
