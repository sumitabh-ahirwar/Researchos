import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bookmark,
  BookmarkCheck,
  Check,
  Clock,
  Copy,
  Download,
  FileSearch,
  Maximize2,
  Minimize2,
  MessageSquareWarning,
  Printer,
  ScrollText,
} from "lucide-react";

import MarkdownRenderer from "./MarkdownRenderer.jsx";
import TableOfContents from "./TableOfContents.jsx";
import CitationList from "./CitationList.jsx";
import Badge from "../ui/Badge.jsx";
import Button from "../ui/Button.jsx";
import Tooltip from "../ui/Tooltip.jsx";
import { EmptyState, SkeletonText } from "../ui/Feedback.jsx";
import { useReportOutline, useReadingProgress, outlineByLine } from "../../hooks/useReportOutline.js";
import { copyToClipboard, downloadMarkdown, printReport } from "../../utils/exportReport.js";
import { MODE_BY_ID } from "../../constants/modes.js";
import { formatDuration, formatRelativeTime, readingTime, countWords } from "../../utils/format.js";
import { cx } from "../../utils/cx.js";

/**
 * Long-form report reading surface.
 *
 * Layout is a sticky table of contents beside a measure-constrained prose
 * column — roughly 72 characters, which is where line length stops fighting
 * the reader on multi-thousand-word output.
 *
 * Fullscreen is a CSS state rather than the Fullscreen API so the browser's
 * own chrome (and the print dialog) stay reachable; Escape exits.
 */
export default function ReportViewer({
  report,
  feedback,
  topic,
  mode,
  sources = [],
  metadata,
  createdAt,
  isLoading = false,
  saved = false,
  onToggleSaved,
  emptyDescription,
  onNotify,
}) {
  const [fullscreen, setFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const bodyRef = useRef(null);

  const outline = useReportOutline(report);
  const outlineIndex = useMemo(() => outlineByLine(outline), [outline]);
  const { activeId, progress } = useReadingProgress(bodyRef, outline);

  const modeMeta = MODE_BY_ID[mode];
  const hasReport = Boolean(report);

  useEffect(() => {
    if (!fullscreen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setFullscreen(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [fullscreen]);

  const handleCopy = async () => {
    const ok = await copyToClipboard(report);
    if (!ok) {
      onNotify?.("error", "Copy failed", "Your browser blocked clipboard access.");
      return;
    }
    setCopied(true);
    onNotify?.("success", "Report copied");
    setTimeout(() => setCopied(false), 1800);
  };

  /* ---------------------------------------------------------------------
     Loading — a skeleton shaped like a report, so the layout does not jump
     when the real content arrives.
     --------------------------------------------------------------------- */
  if (isLoading && !hasReport) {
    return (
      <div className="card" style={{ padding: "var(--space-8)" }}>
        <div className="stack" style={{ gap: "var(--space-6)", maxWidth: "var(--reading-measure)" }}>
          <div className="skeleton" style={{ height: 32, width: "70%" }} />
          <div className="row" style={{ gap: "var(--space-3)" }}>
            <div className="skeleton" style={{ height: 18, width: 90 }} />
            <div className="skeleton" style={{ height: 18, width: 110 }} />
          </div>
          <SkeletonText lines={5} />
          <div className="skeleton" style={{ height: 24, width: "45%" }} />
          <SkeletonText lines={7} />
          <SkeletonText lines={4} />
        </div>
        <p
          className="sr-only"
          role="status"
          aria-live="polite"
        >
          Generating your research report.
        </p>
      </div>
    );
  }

  /* ---------------------------------------------------------------------
     Empty
     --------------------------------------------------------------------- */
  if (!hasReport) {
    return (
      <div className="card">
        <EmptyState
          icon={ScrollText}
          title="Your report will appear here"
          description={
            emptyDescription ??
            "Describe a topic, pick a research mode, and the pipeline will write a cited report into this pane."
          }
        />
      </div>
    );
  }

  const words = countWords(report);
  const minutes = readingTime(report);
  const elapsedSeconds = metadata?.elapsed_seconds;

  return (
    <>
      {fullscreen && (
        <div className="reading-progress" aria-hidden="true">
          <div className="reading-progress__bar" style={{ width: `${progress}%` }} />
        </div>
      )}

      <div className={cx("report-layout", fullscreen && "report-layout--fullscreen")}>
        <TableOfContents outline={outline} activeId={activeId} containerRef={bodyRef} />

        <div style={{ minWidth: 0 }}>
          <div className="report-toolbar">
            <Badge variant="brand" icon={modeMeta?.icon} size="lg">
              {modeMeta?.fullLabel ?? mode}
            </Badge>

            <span className="spacer" />

            {onToggleSaved && (
              <Tooltip label={saved ? "Remove from saved" : "Save report"}>
                <Button
                  variant={saved ? "soft" : "ghost"}
                  size="sm"
                  leadingIcon={saved ? BookmarkCheck : Bookmark}
                  onClick={onToggleSaved}
                >
                  {saved ? "Saved" : "Save"}
                </Button>
              </Tooltip>
            )}

            <Tooltip label="Copy Markdown">
              <Button
                variant="ghost"
                size="sm"
                leadingIcon={copied ? Check : Copy}
                onClick={handleCopy}
              >
                {copied ? "Copied" : "Copy"}
              </Button>
            </Tooltip>

            <Tooltip label="Download as .md">
              <Button
                variant="ghost"
                size="sm"
                iconOnly
                leadingIcon={Download}
                onClick={() => downloadMarkdown(report, topic)}
                aria-label="Download report as Markdown"
              />
            </Tooltip>

            <Tooltip label="Print or save as PDF">
              <Button
                variant="ghost"
                size="sm"
                iconOnly
                leadingIcon={Printer}
                onClick={printReport}
                aria-label="Print report or save as PDF"
              />
            </Tooltip>

            <Tooltip label={fullscreen ? "Exit fullscreen (Esc)" : "Fullscreen"}>
              <Button
                variant="ghost"
                size="sm"
                iconOnly
                leadingIcon={fullscreen ? Minimize2 : Maximize2}
                onClick={() => setFullscreen((current) => !current)}
                aria-pressed={fullscreen}
                aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              />
            </Tooltip>
          </div>

          <h1 className="report-title">{topic}</h1>

          <div className="report-meta">
            <span className="report-meta__item">
              <ScrollText size={13} aria-hidden="true" />
              {words.toLocaleString()} words
            </span>
            <span className="report-meta__item">
              <Clock size={13} aria-hidden="true" />
              {minutes} min read
            </span>
            {Number.isFinite(elapsedSeconds) && (
              <span className="report-meta__item">
                <Clock size={13} aria-hidden="true" />
                Generated in {formatDuration(elapsedSeconds)}
              </span>
            )}
            {sources.length > 0 && (
              <span className="report-meta__item">
                <FileSearch size={13} aria-hidden="true" />
                {sources.length} sources
              </span>
            )}
            {createdAt && <span className="report-meta__item">{formatRelativeTime(createdAt)}</span>}
          </div>

          <article className="prose" ref={bodyRef}>
            <MarkdownRenderer content={report} outlineIndex={outlineIndex} />
          </article>

          <CitationList sources={sources} />

          {feedback && (
            <section className="critique" aria-labelledby="critique-heading">
              <p className="critique__head" id="critique-heading">
                <MessageSquareWarning size={16} aria-hidden="true" />
                Critic feedback
              </p>
              <div className="prose">
                <MarkdownRenderer content={feedback} />
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
