import { useEffect, useMemo, useState } from "react";

import { slugify } from "../utils/format.js";

const HEADING_PATTERN = /^(#{1,3})\s+(.+?)\s*$/;
const FENCE_PATTERN = /^\s*(```|~~~)/;

/**
 * Parse a Markdown report into a table of contents.
 *
 * Headings are read from the source rather than the rendered DOM so the TOC is
 * available on first paint. Fenced code blocks are tracked and skipped, which
 * stops comment lines like `# install deps` from becoming sections. Slugs are
 * de-duplicated so two identically named headings still scroll to the right one.
 */
export function useReportOutline(markdown) {
  return useMemo(() => {
    if (!markdown) return [];

    const seen = new Map();
    const headings = [];
    let insideFence = false;

    markdown.split("\n").forEach((line, index) => {
      if (FENCE_PATTERN.test(line)) {
        insideFence = !insideFence;
        return;
      }
      if (insideFence) return;

      const match = line.match(HEADING_PATTERN);
      if (!match) return;

      const level = match[1].length;
      const text = match[2].replace(/[*_`]/g, "").trim();
      if (!text) return;

      const base = slugify(text) || `section-${headings.length + 1}`;
      const count = seen.get(base) ?? 0;
      seen.set(base, count + 1);

      headings.push({
        id: count === 0 ? base : `${base}-${count}`,
        text,
        level,
        // 1-based source line, matching mdast node.position.start.line. The
        // renderer keys anchor ids off this so the TOC and the headings agree
        // even when two sections share a title.
        line: index + 1,
      });
    });

    return headings;
  }, [markdown]);
}

/** Map of source line → outline entry, for the Markdown renderer. */
export function outlineByLine(outline) {
  return new Map(outline.map((entry) => [entry.line, entry]));
}

/**
 * Track which outline entry is currently in view and how far the reader has
 * scrolled through the report. Uses IntersectionObserver so it costs nothing
 * per scroll frame.
 */
export function useReadingProgress(containerRef, outline) {
  const [activeId, setActiveId] = useState(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || outline.length === 0) return undefined;

    const headings = outline
      .map((entry) => container.querySelector(`#${CSS.escape(entry.id)}`))
      .filter(Boolean);

    if (headings.length === 0) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-88px 0px -70% 0px", threshold: [0, 1] },
    );

    headings.forEach((heading) => observer.observe(heading));
    return () => observer.disconnect();
  }, [containerRef, outline]);

  useEffect(() => {
    const handleScroll = () => {
      const container = containerRef.current;
      if (!container) return;

      const { top, height } = container.getBoundingClientRect();
      const scrollable = height - window.innerHeight;

      if (scrollable <= 0) {
        setProgress(top <= 0 ? 100 : 0);
        return;
      }

      setProgress(Math.min(100, Math.max(0, (-top / scrollable) * 100)));
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [containerRef]);

  return { activeId, progress };
}
