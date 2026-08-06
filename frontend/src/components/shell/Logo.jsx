import { Link } from "react-router-dom";
import { Hexagon } from "lucide-react";

import { cx } from "../../utils/cx.js";

/**
 * Brand lockup. Renders as a link by default so the mark is always a way home;
 * pass `as="div"` where a nested anchor would be invalid.
 */
export default function Logo({ to = "/", size = "md", showWord = true, className, as }) {
  const Wrapper = as ?? Link;
  const wrapperProps = as ? {} : { to, "aria-label": "ResearchOS home" };

  return (
    <Wrapper className={cx("row", className)} style={{ gap: "var(--space-3)" }} {...wrapperProps}>
      <span className={cx("brand-mark", size === "lg" && "brand-mark--lg")} aria-hidden="true">
        <Hexagon size={size === "lg" ? 22 : 18} strokeWidth={2.2} fill="currentColor" fillOpacity={0.25} />
      </span>
      {showWord && (
        <span className="brand-word">
          Research<em>OS</em>
        </span>
      )}
    </Wrapper>
  );
}
