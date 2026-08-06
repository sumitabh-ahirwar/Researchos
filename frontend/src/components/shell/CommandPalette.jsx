import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { CornerDownLeft, FileText, Search } from "lucide-react";

import { PRIMARY_NAV, SECONDARY_NAV } from "../../constants/navigation.js";
import { useWorkspace } from "../../context/WorkspaceContext.jsx";
import { formatRelativeTime } from "../../utils/format.js";

/**
 * Command palette — search across navigation and the saved report library.
 *
 * Implements the keyboard contract people expect from this pattern: arrows to
 * move, Enter to run, Escape to dismiss, and the active row scrolled into view
 * so keyboard navigation never runs off the bottom of the list.
 */
export default function CommandPalette({ open, onClose }) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const navigate = useNavigate();
  const { library } = useWorkspace();

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();

    const pages = [...PRIMARY_NAV, ...SECONDARY_NAV]
      .filter((item) => !term || item.label.toLowerCase().includes(term))
      .map((item) => ({
        id: `page-${item.to}`,
        group: "Pages",
        label: item.label,
        icon: item.icon,
        to: item.to,
      }));

    const reports = library.reports
      .filter((entry) => !term || entry.topic.toLowerCase().includes(term))
      .slice(0, 6)
      .map((entry) => ({
        id: `report-${entry.id}`,
        group: "Reports",
        label: entry.topic,
        meta: formatRelativeTime(entry.createdAt),
        icon: FileText,
        to: `/app/reports/${entry.id}`,
      }));

    return [...pages, ...reports];
  }, [query, library.reports]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) return undefined;
    setQuery("");
    const raf = requestAnimationFrame(() => inputRef.current?.focus());
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = overflow;
    };
  }, [open]);

  // Keep the highlighted row visible as the selection moves.
  useEffect(() => {
    listRef.current
      ?.querySelector('[data-active="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const run = (item) => {
    if (!item) return;
    navigate(item.to);
    onClose();
  };

  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      onClose();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % Math.max(results.length, 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => (current - 1 + results.length) % Math.max(results.length, 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      run(results[activeIndex]);
    }
  };

  let lastGroup = null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="palette__overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.14 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <motion.div
            className="palette"
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            initial={{ opacity: 0, y: -16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            onKeyDown={handleKeyDown}
          >
            <div className="palette__input-row">
              <Search size={18} aria-hidden="true" style={{ color: "var(--text-tertiary)" }} />
              <input
                ref={inputRef}
                className="palette__input"
                placeholder="Search pages and reports…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                aria-label="Search"
                aria-activedescendant={results[activeIndex]?.id}
                aria-controls="palette-results"
              />
              <kbd className="kbd">Esc</kbd>
            </div>

            <div className="palette__results" id="palette-results" role="listbox" ref={listRef}>
              {results.length === 0 && (
                <p
                  style={{
                    padding: "var(--space-6)",
                    textAlign: "center",
                    color: "var(--text-tertiary)",
                    fontSize: "var(--text-sm)",
                  }}
                >
                  No matches for “{query}”.
                </p>
              )}

              {results.map((item, index) => {
                const showGroup = item.group !== lastGroup;
                lastGroup = item.group;

                return (
                  <div key={item.id}>
                    {showGroup && <p className="palette__group-label">{item.group}</p>}
                    <button
                      type="button"
                      id={item.id}
                      role="option"
                      aria-selected={index === activeIndex}
                      className="palette__item"
                      data-active={index === activeIndex}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => run(item)}
                    >
                      <item.icon size={16} aria-hidden="true" />
                      <span className="truncate">{item.label}</span>
                      {item.meta && <span className="palette__item-sub">{item.meta}</span>}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="palette__footer">
              <span className="row" style={{ gap: "var(--space-2)" }}>
                <kbd className="kbd">↑</kbd>
                <kbd className="kbd">↓</kbd> navigate
              </span>
              <span className="row" style={{ gap: "var(--space-2)" }}>
                <kbd className="kbd">
                  <CornerDownLeft size={10} />
                </kbd>
                open
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
