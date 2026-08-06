import { NavLink, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { PanelLeftClose, PanelLeftOpen, Plus, X } from "lucide-react";

import Logo from "./Logo.jsx";
import Button from "../ui/Button.jsx";
import Tooltip from "../ui/Tooltip.jsx";
import { PRIMARY_NAV, SECONDARY_NAV } from "../../constants/navigation.js";
import { useWorkspace } from "../../context/WorkspaceContext.jsx";
import { formatRelativeTime } from "../../utils/format.js";
import { cx } from "../../utils/cx.js";

/**
 * Primary navigation rail.
 *
 * Collapsed mode hides labels but keeps tooltips, so the rail stays usable at
 * icon width. On small screens the same markup becomes an overlay drawer —
 * `onClose` is only wired up there, which is why every link closes the drawer
 * on click but is a no-op on desktop.
 */
export default function Sidebar({ collapsed, onToggleCollapse, onClose, isOverlay }) {
  const { library } = useWorkspace();

  const counts = {
    "/app/history": library.reports.length,
    "/app/saved": library.saved.length,
  };

  const renderLink = (item) => {
    const link = (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.end}
        onClick={onClose}
        className={({ isActive }) => cx("nav-item", isActive && "is-active")}
      >
        <item.icon size={18} aria-hidden="true" />
        <span>{item.label}</span>
        {counts[item.to] > 0 && <span className="nav-item__count">{counts[item.to]}</span>}
      </NavLink>
    );

    if (collapsed && !isOverlay) {
      return (
        <Tooltip key={item.to} label={item.label} side="right">
          {link}
        </Tooltip>
      );
    }

    return link;
  };

  return (
    // The slide only applies in overlay mode, where .sidebar is position:fixed
    // and can actually be transformed. On desktop it is a static grid column,
    // so it mounts with no animation at all.
    <motion.aside
      className="sidebar"
      aria-label="Main navigation"
      initial={isOverlay ? { x: "-100%" } : false}
      animate={isOverlay ? { x: 0 } : undefined}
      exit={isOverlay ? { x: "-100%" } : undefined}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="sidebar__brand">
        <Logo showWord={!collapsed || isOverlay} />
        {isOverlay ? (
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            leadingIcon={X}
            onClick={onClose}
            aria-label="Close navigation"
            style={{ marginLeft: "auto" }}
          />
        ) : (
          !collapsed && (
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              leadingIcon={PanelLeftClose}
              onClick={onToggleCollapse}
              aria-label="Collapse sidebar"
              style={{ marginLeft: "auto" }}
            />
          )
        )}
      </div>

      <div className="sidebar__cta">
        <Button
          to="/app/research"
          variant="gradient"
          size="md"
          block={!collapsed || isOverlay}
          iconOnly={collapsed && !isOverlay}
          leadingIcon={Plus}
          onClick={onClose}
          aria-label="Start new research"
        >
          <span className="sidebar__cta-label">New Research</span>
        </Button>
      </div>

      <nav className="sidebar__section">{PRIMARY_NAV.map(renderLink)}</nav>

      {library.recent.length > 0 && (
        <div className="sidebar__section" style={{ minHeight: 0 }}>
          <p className="sidebar__section-label">Recent</p>
          <div className="sidebar__recent">
            {library.recent.map((entry) => (
              <Link
                key={entry.id}
                to={`/app/reports/${entry.id}`}
                className="recent-item"
                onClick={onClose}
              >
                <span className="recent-item__title truncate">{entry.topic}</span>
                <span className="recent-item__meta">
                  {entry.mode} · {formatRelativeTime(entry.createdAt)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="sidebar__footer">
        {SECONDARY_NAV.map(renderLink)}
        {collapsed && !isOverlay && (
          <Tooltip label="Expand sidebar" side="right">
            <button
              type="button"
              className="nav-item"
              onClick={onToggleCollapse}
              aria-label="Expand sidebar"
            >
              <PanelLeftOpen size={18} aria-hidden="true" />
              <span>Expand</span>
            </button>
          </Tooltip>
        )}
      </div>
    </motion.aside>
  );
}
