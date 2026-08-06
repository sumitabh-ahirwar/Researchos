import { FileText, Quote } from "lucide-react";

import Badge from "../ui/Badge.jsx";

/**
 * Retrieved source cards.
 *
 * Renders the `sources` array the API returns for PDF-grounded runs. Each entry
 * carries `source_number`, `filename`, `page`, and a `preview` excerpt — enough
 * for a reader to verify a claim against the original page without leaving the
 * report.
 */
export default function CitationList({ sources }) {
  if (!sources || sources.length === 0) return null;

  return (
    <section className="citations" aria-labelledby="citations-heading">
      <div className="row" style={{ gap: "var(--space-3)" }}>
        <span className="icon-tile icon-tile--sm" aria-hidden="true">
          <Quote size={15} />
        </span>
        <div>
          <h2 id="citations-heading" style={{ fontSize: "var(--text-lg)" }}>
            Retrieved sources
          </h2>
          <p style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)" }}>
            Passages the retriever pulled for this report
          </p>
        </div>
        <span className="spacer" />
        <Badge variant="neutral" size="lg">
          {sources.length}
        </Badge>
      </div>

      <ol className="citation-grid" role="list">
        {sources.map((source, index) => (
          <li
            className="citation-card"
            key={`${source.source_number ?? index}-${source.page ?? index}`}
          >
            <div className="citation-card__head">
              <span className="citation-card__number" aria-hidden="true">
                {source.source_number ?? index + 1}
              </span>
              <span className="citation-card__file truncate" title={source.filename}>
                {source.filename ?? "Document"}
              </span>
            </div>

            <div className="row" style={{ gap: "var(--space-2)" }}>
              <Badge variant="outline" icon={FileText}>
                Page {source.page ?? "—"}
              </Badge>
            </div>

            {source.preview && <p className="citation-card__preview clamp-3">{source.preview}</p>}
          </li>
        ))}
      </ol>
    </section>
  );
}
