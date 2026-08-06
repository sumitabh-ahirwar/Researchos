import { cloneElement, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { cx } from "../../utils/cx.js";

/**
 * Menu anchored to a trigger element.
 *
 * The trigger is cloned so callers pass any button they like while the menu
 * still owns aria-expanded / aria-haspopup. Closes on outside pointer-down and
 * on Escape, and returns focus to the trigger so keyboard users are not
 * stranded at the top of the document.
 */
export default function Dropdown({ trigger, children, align = "end", className }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className={cx("dropdown", className)} ref={rootRef}>
      {cloneElement(trigger, {
        ref: triggerRef,
        onClick: (event) => {
          trigger.props.onClick?.(event);
          setOpen((current) => !current);
        },
        "aria-haspopup": "menu",
        "aria-expanded": open,
      })}

      <AnimatePresence>
        {open && (
          <motion.div
            className={cx("dropdown__menu", `dropdown__menu--${align}`)}
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => setOpen(false)}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function DropdownItem({ icon: Icon, danger = false, children, className, ...rest }) {
  return (
    <button
      type="button"
      role="menuitem"
      className={cx("dropdown__item", danger && "dropdown__item--danger", className)}
      {...rest}
    >
      {Icon && <Icon size={16} aria-hidden="true" />}
      {children}
    </button>
  );
}

export function DropdownLabel({ children }) {
  return <p className="dropdown__label">{children}</p>;
}

export function DropdownSeparator() {
  return <div className="dropdown__separator" role="separator" />;
}
