import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  FileText,
  Loader2,
  RotateCw,
  Trash2,
  UploadCloud,
} from "lucide-react";

import Badge from "../ui/Badge.jsx";
import Button from "../ui/Button.jsx";
import Tooltip from "../ui/Tooltip.jsx";
import { Progress } from "../ui/Feedback.jsx";
import { formatBytes, pluralize } from "../../utils/format.js";

/**
 * Drag-and-drop PDF intake.
 *
 * Two details worth noting:
 *
 * 1. The upload endpoint takes one file per request, so a dropped batch is
 *    uploaded sequentially by the session hook. Each card therefore carries
 *    its own status — one failure does not invalidate the rest.
 * 2. Only one document can ground a given run, because `generate` accepts a
 *    single `document_id`. The active card is explicitly marked rather than
 *    implying every uploaded file is in play.
 *
 * The drag counter guards against the flicker you get when dragging over child
 * elements, which fire dragleave on the parent.
 */
export default function PdfDropzone({
  documents,
  activeDocumentId,
  onSelectActive,
  onUpload,
  onRemove,
  onRetry,
  disabled = false,
}) {
  const [dragging, setDragging] = useState(false);
  const dragCounter = useRef(0);
  const inputRef = useRef(null);

  const handleDragEnter = useCallback((event) => {
    event.preventDefault();
    dragCounter.current += 1;
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((event) => {
    event.preventDefault();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    (event) => {
      event.preventDefault();
      dragCounter.current = 0;
      setDragging(false);
      if (disabled) return;
      onUpload(event.dataTransfer.files);
    },
    [disabled, onUpload],
  );

  const readyCount = documents.filter((doc) => doc.status === "ready").length;

  return (
    <div className="stack" style={{ gap: "var(--space-4)" }}>
      <div
        className="dropzone"
        data-dragging={dragging}
        onDragEnter={handleDragEnter}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <span className="dropzone__icon">
          <UploadCloud size={22} aria-hidden="true" />
        </span>
        <span className="dropzone__title">
          {dragging ? "Drop to index" : "Drop PDFs here, or browse"}
        </span>
        <span className="dropzone__hint">
          PDF only · each file is chunked, embedded, and indexed on upload
        </span>

        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          multiple
          disabled={disabled}
          onChange={(event) => {
            onUpload(event.target.files);
            // Reset so re-selecting the same file still fires a change event.
            event.target.value = "";
          }}
          aria-label="Upload PDF documents"
        />
      </div>

      {documents.length > 0 && (
        <>
          <div className="row-between">
            <p className="section-heading__kicker">
              {pluralize(documents.length, "document")} · {readyCount} indexed
            </p>
            {readyCount > 1 && (
              <p style={{ fontSize: "var(--text-2xs)", color: "var(--text-tertiary)" }}>
                Select which one grounds the next run
              </p>
            )}
          </div>

          <ul className="file-list" role="list">
            <AnimatePresence initial={false}>
              {documents.map((doc) => {
                const isActive = doc.localId === activeDocumentId && doc.status === "ready";
                const selectable = doc.status === "ready";

                return (
                  <motion.li
                    key={doc.localId}
                    layout
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="file-card"
                    data-active={isActive}
                    data-status={doc.status}
                  >
                    <span
                      className={`icon-tile icon-tile--sm ${
                        doc.status === "failed" ? "icon-tile--danger" : ""
                      }`}
                      aria-hidden="true"
                    >
                      {doc.status === "uploading" ? (
                        <Loader2 className="spin" size={16} />
                      ) : (
                        <FileText size={16} />
                      )}
                    </span>

                    <div className="file-card__body">
                      <p className="file-card__name truncate">{doc.filename ?? doc.name}</p>

                      {doc.status === "uploading" && (
                        <div style={{ marginTop: "var(--space-2)" }}>
                          <Progress indeterminate size="thin" label="Indexing document" />
                        </div>
                      )}

                      {doc.status === "ready" && (
                        <p className="file-card__meta">
                          <span>{doc.pages} pages</span>
                          <span aria-hidden="true">·</span>
                          <span>{doc.chunks} chunks</span>
                          {doc.size ? (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>{formatBytes(doc.size)}</span>
                            </>
                          ) : null}
                        </p>
                      )}

                      {doc.status === "failed" && (
                        <p className="file-card__meta" style={{ color: "var(--danger-soft-text)" }}>
                          {doc.error || "Upload failed."}
                        </p>
                      )}
                    </div>

                    <div className="file-card__actions">
                      {isActive && (
                        <Badge variant="brand" icon={CheckCircle2}>
                          Active
                        </Badge>
                      )}

                      {selectable && !isActive && (
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => onSelectActive(doc.localId)}
                        >
                          Use this
                        </Button>
                      )}

                      {doc.status === "failed" && onRetry && (
                        <Tooltip label="Retry upload">
                          <Button
                            variant="ghost"
                            size="xs"
                            iconOnly
                            leadingIcon={RotateCw}
                            onClick={() => onRetry(doc.localId)}
                            aria-label={`Retry uploading ${doc.name}`}
                          />
                        </Tooltip>
                      )}

                      <Tooltip label="Remove">
                        <Button
                          variant="ghost"
                          size="xs"
                          iconOnly
                          leadingIcon={Trash2}
                          onClick={() => onRemove(doc.localId)}
                          disabled={doc.status === "uploading"}
                          aria-label={`Remove ${doc.filename ?? doc.name}`}
                        />
                      </Tooltip>
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        </>
      )}
    </div>
  );
}
