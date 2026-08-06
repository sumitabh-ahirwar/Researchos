import { Link } from "react-router-dom";
import {
  Bookmark,
  FileStack,
  FileText,
  Globe2,
  Layers3,
  Pin,
  Plus,
  ScrollText,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import Button from "../components/ui/Button.jsx";
import Badge from "../components/ui/Badge.jsx";
import { EmptyState, Progress } from "../components/ui/Feedback.jsx";
import ReportCard from "../components/report/ReportCard.jsx";
import { useWorkspace } from "../context/WorkspaceContext.jsx";
import { RESEARCH_MODES } from "../constants/modes.js";
import { formatRelativeTime } from "../utils/format.js";

const QUICK_ACTIONS = [
  {
    id: "web",
    to: "/app/research",
    icon: Globe2,
    title: "Web research",
    desc: "Search live sources and synthesise",
  },
  {
    id: "pdf",
    to: "/app/research",
    icon: FileText,
    title: "PDF research",
    desc: "Ground a report in your documents",
  },
  {
    id: "hybrid",
    to: "/app/research",
    icon: Layers3,
    title: "Hybrid research",
    desc: "Merge documents with the web",
  },
];

/**
 * Dashboard — an orientation surface, not a vanity wall.
 *
 * Everything shown is derived from reports actually generated in this browser.
 * When there is no history the page collapses to a single call to action rather
 * than displaying zeroed-out charts, because empty metrics teach nothing.
 */
export default function Dashboard() {
  const { library, profile } = useWorkspace();
  const { stats } = library;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  if (stats.total === 0) {
    return (
      <div className="card">
        <EmptyState
          icon={Sparkles}
          title={`${greeting}, ${profile.name}`}
          description="No research yet. Describe a topic, choose web, PDF, or hybrid mode, and the agent pipeline will write your first cited report."
          action={
            <Button to="/app/research" variant="gradient" size="lg" leadingIcon={Plus}>
              Start your first research
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h2 className="page-header__title">
            {greeting}, {profile.name}
          </h2>
          <p className="page-header__subtitle">
            {stats.total} report{stats.total === 1 ? "" : "s"} generated in this browser.
            {library.recent[0] && ` Last run ${formatRelativeTime(library.recent[0].createdAt)}.`}
          </p>
        </div>
        <Button to="/app/research" variant="gradient" leadingIcon={Plus}>
          New Research
        </Button>
      </div>

      {/* Stats ------------------------------------------------------------ */}
      <div className="stat-grid section-block">
        <div className="stat-tile">
          <span className="stat-tile__label">
            <ScrollText size={14} aria-hidden="true" />
            Reports
          </span>
          <span className="stat-tile__value">{stats.total}</span>
          <span className="stat-tile__detail">stored locally</span>
        </div>

        <div className="stat-tile">
          <span className="stat-tile__label">
            <Bookmark size={14} aria-hidden="true" />
            Saved
          </span>
          <span className="stat-tile__value">{stats.saved}</span>
          <span className="stat-tile__detail">{stats.pinned} pinned</span>
        </div>

        <div className="stat-tile">
          <span className="stat-tile__label">
            <TrendingUp size={14} aria-hidden="true" />
            Words written
          </span>
          <span className="stat-tile__value">{stats.words.toLocaleString()}</span>
          <span className="stat-tile__detail">across all reports</span>
        </div>

        <div className="stat-tile">
          <span className="stat-tile__label">
            <FileStack size={14} aria-hidden="true" />
            By mode
          </span>
          <div className="mode-meter" style={{ marginTop: "var(--space-1)" }}>
            {RESEARCH_MODES.map((mode) => {
              const count = stats.byMode[mode.id] ?? 0;
              return (
                <div className="mode-meter__row" key={mode.id}>
                  <span>{mode.label}</span>
                  <Progress
                    value={(count / Math.max(stats.total, 1)) * 100}
                    size="thin"
                    label={`${mode.label} reports`}
                  />
                  <span className="mode-meter__count">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick actions ---------------------------------------------------- */}
      <section className="section-block">
        <div className="section-block__header">
          <h3 className="section-block__title">Quick actions</h3>
        </div>
        <div className="quick-actions">
          {QUICK_ACTIONS.map((action) => (
            <Link key={action.id} to={action.to} className="quick-action">
              <span className="icon-tile icon-tile--md" aria-hidden="true">
                <action.icon size={19} />
              </span>
              <span>
                <span className="quick-action__title">{action.title}</span>
                <span className="quick-action__desc" style={{ display: "block" }}>
                  {action.desc}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Pinned ----------------------------------------------------------- */}
      {library.pinned.length > 0 && (
        <section className="section-block">
          <div className="section-block__header">
            <h3 className="section-block__title">
              <span className="row" style={{ gap: "var(--space-2)" }}>
                <Pin size={16} aria-hidden="true" />
                Pinned
              </span>
            </h3>
            <Badge variant="neutral">{library.pinned.length}</Badge>
          </div>
          <div className="report-grid">
            {library.pinned.slice(0, 3).map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                onToggleSaved={library.toggleSaved}
                onTogglePinned={library.togglePinned}
                onDelete={library.removeReport}
              />
            ))}
          </div>
        </section>
      )}

      {/* Recent activity -------------------------------------------------- */}
      <section className="section-block">
        <div className="section-block__header">
          <h3 className="section-block__title">Recent activity</h3>
          <Button to="/app/history" variant="link" size="sm">
            View all
          </Button>
        </div>
        <div className="report-grid">
          {library.reports.slice(0, 6).map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onToggleSaved={library.toggleSaved}
              onTogglePinned={library.togglePinned}
              onDelete={library.removeReport}
            />
          ))}
        </div>
      </section>
    </>
  );
}
