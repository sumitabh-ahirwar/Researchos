import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";

import { cx } from "../../utils/cx.js";

const ToastContext = createContext(null);

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

/**
 * Toast provider.
 *
 * The viewport is an aria-live region so notifications are announced without
 * stealing focus. Timers are tracked per toast and cleared on dismiss, which
 * keeps a manually dismissed toast from firing a stale removal later.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    ({ variant = "info", title, message, duration = 5000 }) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((current) => [...current, { id, variant, title, message }]);

      if (duration > 0) {
        timers.current.set(
          id,
          setTimeout(() => dismiss(id), duration),
        );
      }

      return id;
    },
    [dismiss],
  );

  const value = useMemo(
    () => ({
      toast: push,
      dismiss,
      success: (title, message) => push({ variant: "success", title, message }),
      error: (title, message) => push({ variant: "error", title, message, duration: 7000 }),
      warning: (title, message) => push({ variant: "warning", title, message }),
      info: (title, message) => push({ variant: "info", title, message }),
    }),
    [push, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className="toast-viewport" role="region" aria-live="polite" aria-label="Notifications">
          <AnimatePresence initial={false}>
            {toasts.map((toast) => {
              const Icon = ICONS[toast.variant] ?? Info;

              return (
                <motion.div
                  key={toast.id}
                  layout
                  className={cx("toast", `toast--${toast.variant}`)}
                  initial={{ opacity: 0, x: 40, scale: 0.96 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 40, scale: 0.96 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                >
                  <span className="toast__icon">
                    <Icon size={16} aria-hidden="true" />
                  </span>
                  <div className="toast__body">
                    {toast.title && <p className="toast__title">{toast.title}</p>}
                    {toast.message && <p className="toast__message">{toast.message}</p>}
                  </div>
                  <button
                    type="button"
                    className="btn btn--ghost btn--xs btn--icon"
                    onClick={() => dismiss(toast.id)}
                    aria-label="Dismiss notification"
                  >
                    <X size={14} aria-hidden="true" />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside a <ToastProvider>.");
  return context;
}
