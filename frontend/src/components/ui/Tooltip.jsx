import { useId, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { cx } from "../../utils/cx.js";

/**
 * Tooltip that opens on hover *and* focus, so keyboard users get the same hint
 * as mouse users. The bubble is aria-hidden and the description is attached to
 * the trigger via aria-describedby, which avoids screen readers announcing the
 * text twice.
 */
export default function Tooltip({ label, side = "top", children, className, delay = 120 }) {
  const [open, setOpen] = useState(false);
  const [timer, setTimer] = useState(null);
  const id = useId();

  const show = () => {
    const handle = setTimeout(() => setOpen(true), delay);
    setTimer(handle);
  };

  const hide = () => {
    if (timer) clearTimeout(timer);
    setOpen(false);
  };

  if (!label) return children;

  return (
    <span
      className={cx("tooltip-host", className)}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocusCapture={() => setOpen(true)}
      onBlurCapture={hide}
    >
      <span aria-describedby={open ? id : undefined} style={{ display: "contents" }}>
        {children}
      </span>

      <AnimatePresence>
        {open && (
          <motion.span
            id={id}
            role="tooltip"
            className={cx("tooltip", `tooltip--${side}`)}
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.12 }}
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
