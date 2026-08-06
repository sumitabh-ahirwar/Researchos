import { CircleHelp, LogOut, Menu, Search, Settings, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

import Button from "../ui/Button.jsx";
import Dropdown, { DropdownItem, DropdownLabel, DropdownSeparator } from "../ui/Dropdown.jsx";
import { Avatar } from "../ui/Feedback.jsx";
import NotificationCenter, { useUnreadCount } from "./NotificationCenter.jsx";
import ThemeToggle from "./ThemeToggle.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useWorkspace } from "../../context/WorkspaceContext.jsx";

/**
 * Application topbar: page identity on the left, global tools on the right.
 *
 * The search control is a button, not an input — it opens the command palette,
 * and presenting it as a text field would promise inline typing it does not do.
 */
export default function Topbar({ title, subtitle, onOpenSearch, onOpenNav, actions }) {
  const { profile } = useWorkspace();
  const { logout } = useAuth();
  const unread = useUnreadCount();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="topbar">
      <Button
        variant="ghost"
        size="sm"
        iconOnly
        leadingIcon={Menu}
        onClick={onOpenNav}
        aria-label="Open navigation"
        className="show-below-lg"
      />

      <div className="topbar__title">
        <h1 className="truncate">{title}</h1>
        {subtitle && <p className="truncate">{subtitle}</p>}
      </div>

      <div className="topbar__actions">
        <button type="button" className="search-trigger" onClick={onOpenSearch}>
          <Search size={15} aria-hidden="true" />
          <span>Search…</span>
          <kbd className="kbd">Ctrl K</kbd>
        </button>

        {actions}

        <span style={{ position: "relative", display: "inline-flex" }}>
          <NotificationCenter />
          {unread > 0 && <span className="topbar__bell-dot" aria-hidden="true" />}
        </span>

        <ThemeToggle />

        <Dropdown
          align="end"
          trigger={
            <button
              type="button"
              className="btn btn--ghost btn--sm btn--icon"
              aria-label="Account menu"
            >
              <Avatar name={profile.name} size="sm" />
            </button>
          }
        >
          <DropdownLabel>{profile.name}</DropdownLabel>
          {profile.email && (
            <p
              style={{
                padding: "0 var(--space-3) var(--space-2)",
                fontSize: "var(--text-xs)",
                color: "var(--text-tertiary)",
              }}
            >
              {profile.email}
            </p>
          )}
          <DropdownSeparator />
          <DropdownItem icon={User} onClick={() => navigate("/app/settings")}>
            Profile
          </DropdownItem>
          <DropdownItem icon={Settings} onClick={() => navigate("/app/settings")}>
            Settings
          </DropdownItem>
          <DropdownItem icon={CircleHelp} onClick={() => navigate("/app/help")}>
            Help
          </DropdownItem>
          <DropdownSeparator />
          <DropdownItem icon={LogOut} danger onClick={handleLogout}>
            Log out
          </DropdownItem>
        </Dropdown>
      </div>
    </header>
  );
}
