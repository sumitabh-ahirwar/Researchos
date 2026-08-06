/**
 * Report table of contents.
 *
 * Buttons, not anchors: clicking scrolls smoothly and moves focus to the
 * heading, so keyboard and screen-reader users land where sighted users look.
 * The heading is given tabindex="-1" first, because a non-interactive element
 * cannot otherwise receive programmatic focus.
 */
export default function TableOfContents({ outline, activeId, containerRef }) {
  if (outline.length < 2) return null;

  const jumpTo = (id) => {
    const target = containerRef?.current?.querySelector(`#${CSS.escape(id)}`);
    if (!target) return;

    target.scrollIntoView({ behavior: "smooth", block: "start" });
    target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
  };

  return (
    <nav className="toc" aria-label="Table of contents">
      <p className="toc__label">On this page</p>
      <div className="toc__list">
        {outline.map((entry) => (
          <button
            key={entry.id}
            type="button"
            className="toc__link truncate"
            data-level={entry.level}
            aria-current={activeId === entry.id}
            onClick={() => jumpTo(entry.id)}
            title={entry.text}
          >
            {entry.text}
          </button>
        ))}
      </div>
    </nav>
  );
}
