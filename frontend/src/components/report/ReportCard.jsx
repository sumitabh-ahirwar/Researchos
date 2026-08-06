import { Link } from "react-router-dom";
import { Bookmark, BookmarkCheck, Clock, MoreHorizontal, Pin, PinOff, Trash2 } from "lucide-react";

import Badge from "../ui/Badge.jsx";
import Dropdown, { DropdownItem, DropdownSeparator } from "../ui/Dropdown.jsx";
import { MODE_BY_ID } from "../../constants/modes.js";
import { formatRelativeTime } from "../../utils/format.js";

/**
 * Summary card for a stored report.
 *
 * The whole card is a link so the primary action has a large target, with the
 * overflow menu layered on top — its click handler stops propagation so opening
 * the menu never navigates away.
 */
export default function ReportCard({ report, onToggleSaved, onTogglePinned, onDelete }) {
  const modeMeta = MODE_BY_ID[report.mode];
  const excerpt = report.report
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_`>#[\]()]/g, "")
    .trim()
    .slice(0, 180);

  return (
    <article className="report-card">
      <Link to={`/app/reports/${report.id}`} className="report-card__link">
        <div className="report-card__head">
          {modeMeta && (
            <Badge variant="brand" icon={modeMeta.icon}>
              {modeMeta.label}
            </Badge>
          )}
          {report.pinned && (
            <Badge variant="warning" icon={Pin}>
              Pinned
            </Badge>
          )}
          {report.saved && !report.pinned && (
            <Badge variant="success" icon={BookmarkCheck}>
              Saved
            </Badge>
          )}
        </div>

        <h3 className="report-card__title clamp-2">{report.topic}</h3>
        <p className="report-card__excerpt clamp-3">{excerpt}</p>

        <footer className="report-card__meta">
          <span className="row" style={{ gap: "var(--space-1)" }}>
            <Clock size={12} aria-hidden="true" />
            {formatRelativeTime(report.createdAt)}
          </span>
          <span aria-hidden="true">·</span>
          <span>{report.words?.toLocaleString() ?? 0} words</span>
          <span aria-hidden="true">·</span>
          <span>{report.minutes ?? 1} min</span>
        </footer>
      </Link>

      <div className="report-card__menu" onClick={(event) => event.stopPropagation()}>
        <Dropdown
          align="end"
          trigger={
            <button
              type="button"
              className="btn btn--ghost btn--sm btn--icon"
              aria-label={`Actions for ${report.topic}`}
            >
              <MoreHorizontal size={16} aria-hidden="true" />
            </button>
          }
        >
          <DropdownItem
            icon={report.saved ? BookmarkCheck : Bookmark}
            onClick={() => onToggleSaved?.(report.id)}
          >
            {report.saved ? "Remove from saved" : "Save report"}
          </DropdownItem>
          <DropdownItem
            icon={report.pinned ? PinOff : Pin}
            onClick={() => onTogglePinned?.(report.id)}
          >
            {report.pinned ? "Unpin" : "Pin to dashboard"}
          </DropdownItem>
          <DropdownSeparator />
          <DropdownItem icon={Trash2} danger onClick={() => onDelete?.(report.id)}>
            Delete
          </DropdownItem>
        </Dropdown>
      </div>
    </article>
  );
}
