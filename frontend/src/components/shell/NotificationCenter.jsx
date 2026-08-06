import { Bell, CheckCheck, Inbox } from "lucide-react";

import Button from "../ui/Button.jsx";
import Dropdown from "../ui/Dropdown.jsx";
import { EmptyState, IconTile } from "../ui/Feedback.jsx";
import { useWorkspace } from "../../context/WorkspaceContext.jsx";
import { formatRelativeTime } from "../../utils/format.js";

const TONE_BY_KIND = {
  success: "success",
  error: "danger",
  warning: "warning",
  info: "brand",
};

/**
 * Notification feed.
 *
 * Entries are produced locally when a run finishes or fails — there is no
 * push channel from the backend — and persist in localStorage so a completed
 * run is still visible after a reload.
 */
export default function NotificationCenter() {
  const { notifications, markAllRead, clearNotifications } = useWorkspace();
  const unread = notifications.filter((entry) => !entry.read).length;

  return (
    <Dropdown
      align="end"
      trigger={
        <Button
          variant="ghost"
          size="sm"
          iconOnly
          leadingIcon={Bell}
          className="topbar__bell"
          aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
          onClick={markAllRead}
        />
      }
    >
      <div className="notif-panel">
        <header className="notif-panel__header">
          <p style={{ fontWeight: 650, fontSize: "var(--text-sm)" }}>Notifications</p>
          {notifications.length > 0 && (
            <Button variant="link" size="xs" leadingIcon={CheckCheck} onClick={clearNotifications}>
              Clear all
            </Button>
          )}
        </header>

        <div className="notif-panel__list">
          {notifications.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="You're all caught up"
              description="Completed research runs will show up here."
              className="empty-state--compact"
            />
          ) : (
            notifications.map((entry) => (
              <div key={entry.id} className="notif-item">
                <IconTile
                  icon={entry.icon ?? Bell}
                  tone={TONE_BY_KIND[entry.kind] ?? "neutral"}
                  size="sm"
                />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p className="notif-item__title clamp-2">{entry.title}</p>
                  <p className="notif-item__meta">{formatRelativeTime(entry.createdAt)}</p>
                </div>
                {!entry.read && <span className="notif-item__unread" aria-label="Unread" />}
              </div>
            ))
          )}
        </div>
      </div>
    </Dropdown>
  );
}

/** Badge dot rendered by the topbar when there is unread activity. */
export function useUnreadCount() {
  const { notifications } = useWorkspace();
  return notifications.filter((entry) => !entry.read).length;
}
