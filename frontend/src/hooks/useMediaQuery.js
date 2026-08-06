import { useEffect, useState } from "react";

/**
 * Subscribe to a CSS media query from JS. Used for behaviour that cannot be
 * expressed in CSS alone — collapsing the sidebar into an overlay drawer, for
 * instance — rather than for anything a breakpoint could handle.
 */
export default function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => window.matchMedia?.(query).matches ?? false);

  useEffect(() => {
    const list = window.matchMedia(query);
    const handleChange = (event) => setMatches(event.matches);

    setMatches(list.matches);
    list.addEventListener("change", handleChange);
    return () => list.removeEventListener("change", handleChange);
  }, [query]);

  return matches;
}
