import { FileStack, Globe2, Merge } from "lucide-react";

import { MODE_BY_ID } from "../../constants/modes.js";

/**
 * Evidence-source diagram.
 *
 * Shows which knowledge sources the selected mode actually draws on, and — in
 * hybrid mode — that the two are merged into one context before the writer
 * agent runs. Inactive lanes are dimmed rather than hidden so the difference
 * between modes stays legible when switching.
 */
export default function SourceMerge({ mode, activeDocument, sourceCount = 0 }) {
  const usesWeb = mode === "web" || mode === "hybrid";
  const usesPdf = mode === "pdf" || mode === "hybrid";
  const modeMeta = MODE_BY_ID[mode];

  return (
    <section aria-label="Evidence sources">
      <p className="section-heading__kicker">Evidence sources</p>
      <h2 className="section-heading__title" style={{ marginBottom: "var(--space-4)" }}>
        {modeMeta?.fullLabel}
      </h2>

      <div className="source-merge">
        <div className="source-merge__lane" data-active={usesWeb}>
          <Globe2
            size={18}
            aria-hidden="true"
            style={{ margin: "0 auto", color: "var(--text-brand)" }}
          />
          <span className="source-merge__label">Web</span>
          <span className="source-merge__value">
            {usesWeb ? "Live search + scrape" : "Not used"}
          </span>
        </div>

        <span className="source-merge__join" aria-hidden="true">
          <Merge size={16} />
        </span>

        <div className="source-merge__lane" data-active={usesPdf}>
          <FileStack
            size={18}
            aria-hidden="true"
            style={{ margin: "0 auto", color: "var(--text-brand)" }}
          />
          <span className="source-merge__label">Documents</span>
          <span className="source-merge__value">
            {!usesPdf
              ? "Not used"
              : activeDocument
                ? `${activeDocument.chunks} chunks indexed`
                : "No active document"}
          </span>
        </div>
      </div>

      <p className="source-merge__out">
        {mode === "hybrid"
          ? "Retrieved passages and web results are merged into one context, then written up and cited."
          : mode === "pdf"
            ? "Every claim is grounded in passages retrieved from your active document."
            : "Claims are grounded in the pages the search agent retrieved and scraped."}
        {sourceCount > 0 && ` ${sourceCount} source${sourceCount === 1 ? "" : "s"} attached to the last run.`}
      </p>
    </section>
  );
}
