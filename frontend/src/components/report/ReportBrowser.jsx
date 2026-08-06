import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import ReportCard from "./ReportCard.jsx";
import { Input } from "../ui/Field.jsx";
import { EmptyState } from "../ui/Feedback.jsx";
import { RESEARCH_MODES } from "../../constants/modes.js";

const SORTS = [
  { id: "recent", label: "Newest" },
  { id: "oldest", label: "Oldest" },
  { id: "longest", label: "Longest" },
];

/**
 * Filterable report list, shared by History and Saved Reports.
 *
 * Filtering is client-side over the localStorage library, which is capped at
 * 60 entries — small enough that a plain filter beats any indexing, and no
 * request is involved. Pinned reports always float to the top of the result
 * set regardless of sort, since pinning is an explicit priority signal.
 */
export default function ReportBrowser({ reports, library, emptyState }) {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("all");
  const [sort, setSort] = useState("recent");

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();

    const filtered = reports.filter((entry) => {
      const matchesMode = mode === "all" || entry.mode === mode;
      const matchesTerm =
        !term ||
        entry.topic.toLowerCase().includes(term) ||
        entry.report.toLowerCase().includes(term);
      return matchesMode && matchesTerm;
    });

    const sorted = [...filtered].sort((a, b) => {
      if (sort === "longest") return (b.words ?? 0) - (a.words ?? 0);
      const delta = new Date(a.createdAt) - new Date(b.createdAt);
      return sort === "oldest" ? delta : -delta;
    });

    return sorted.sort((a, b) => Number(b.pinned) - Number(a.pinned));
  }, [reports, query, mode, sort]);

  return (
    <>
      <div className="list-toolbar">
        <div className="list-toolbar__search">
          <label htmlFor="report-search" className="sr-only">
            Search reports
          </label>
          <Input
            id="report-search"
            type="search"
            icon={Search}
            placeholder="Search topics and content…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <div className="filter-chips" role="group" aria-label="Filter by mode">
          <button
            type="button"
            className="filter-chip"
            aria-pressed={mode === "all"}
            onClick={() => setMode("all")}
          >
            All
          </button>
          {RESEARCH_MODES.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className="filter-chip"
              aria-pressed={mode === entry.id}
              onClick={() => setMode(entry.id)}
            >
              {entry.label}
            </button>
          ))}
        </div>

        <span className="spacer" />

        <div className="filter-chips" role="group" aria-label="Sort order">
          {SORTS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className="filter-chip"
              aria-pressed={sort === entry.id}
              onClick={() => setSort(entry.id)}
            >
              {entry.label}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="card">
          {query || mode !== "all" ? (
            <EmptyState
              icon={Search}
              title="No matching reports"
              description="Try a different search term, or clear the mode filter."
            />
          ) : (
            emptyState
          )}
        </div>
      ) : (
        <div className="report-grid">
          {visible.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onToggleSaved={library.toggleSaved}
              onTogglePinned={library.togglePinned}
              onDelete={library.removeReport}
            />
          ))}
        </div>
      )}
    </>
  );
}
