import { useEffect, useRef, useState } from "react";

/**
 * Subscribe to a CSS media query from JS. Used for behaviour that cannot be
 * expressed in CSS alone — collapsing the sidebar into an overlay drawer, for
 * instance — rather than for anything a breakpoint could handle.
 *
 * Width queries are frozen while the print dialog is open. Chrome re-evaluates
 * them against the paper size (~794px for A4) during printing, which would
 * otherwise report "mobile" on a desktop screen and unmount layout chrome
 * mid-print. Those flips are transient and never reflect the real viewport, so
 * they are ignored and the true value is re-read on afterprint.
 */
export default function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => window.matchMedia?.(query).matches ?? false);
  const isPrinting = useRef(false);

  useEffect(() => {
    const list = window.matchMedia(query);

    const handleChange = (event) => {
      if (isPrinting.current) return;
      setMatches(event.matches);
    };

    const handleBeforePrint = () => {
      isPrinting.current = true;
    };

    const handleAfterPrint = () => {
      isPrinting.current = false;
      // Re-sync in case the viewport genuinely changed while the dialog was up.
      setMatches(list.matches);
    };

    setMatches(list.matches);
    list.addEventListener("change", handleChange);
    window.addEventListener("beforeprint", handleBeforePrint);
    window.addEventListener("afterprint", handleAfterPrint);

    return () => {
      list.removeEventListener("change", handleChange);
      window.removeEventListener("beforeprint", handleBeforePrint);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, [query]);

  return matches;
}
