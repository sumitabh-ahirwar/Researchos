import { useCallback, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

import Button from "./Button.jsx";
import { cx } from "../../utils/cx.js";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Accessible dialog rendered through a portal.
 *
 * Handles the four things a hand-rolled modal usually gets wrong: Escape to
 * close, focus moved into the dialog on open, focus cycled inside it while
 * open (Tab and Shift+Tab), and focus returned to the trigger on close.
 * Background scroll is locked so the page behind cannot move under the overlay.
 */
export default function Modal({
  open,
  onClose,
  title,
  description,
  size = "md",
  footer,
  children,
  closeOnOverlayClick = true,
  className,
}) {
  const dialogRef = useRef(null);
  const restoreFocusRef = useRef(null);
  const titleId = useId();
  const descId = useId();

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose?.();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;

      const items = Array.from(dialogRef.current.querySelectorAll(FOCUSABLE)).filter(
        (node) => node.offsetParent !== null,
      );
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return undefined;

    restoreFocusRef.current = document.activeElement;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    // Defer so the dialog exists in the DOM before we reach into it.
    const raf = requestAnimationFrame(() => {
      const target =
        dialogRef.current?.querySelector("[data-autofocus]") ??
        dialogRef.current?.querySelector(FOCUSABLE) ??
        dialogRef.current;
      target?.focus();
    });

    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = overflow;
      restoreFocusRef.current?.focus?.();
    };
  }, [open]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal__overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          onMouseDown={(event) => {
            if (closeOnOverlayClick && event.target === event.currentTarget) onClose?.();
          }}
        >
          <motion.div
            ref={dialogRef}
            className={cx("modal", `modal--${size}`, className)}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-describedby={description ? descId : undefined}
            tabIndex={-1}
            onKeyDown={handleKeyDown}
            initial={{ opacity: 0, scale: 0.97, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            {(title || onClose) && (
              <header className="modal__header">
                <div>
                  {title && (
                    <h2 className="modal__title" id={titleId}>
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p className="modal__desc" id={descId}>
                      {description}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  iconOnly
                  leadingIcon={X}
                  onClick={onClose}
                  aria-label="Close dialog"
                />
              </header>
            )}

            <div className="modal__body">{children}</div>

            {footer && <footer className="modal__footer">{footer}</footer>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
