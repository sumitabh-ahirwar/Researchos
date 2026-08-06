import { forwardRef, useId, useState } from "react";
import { AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";

import { cx } from "../../utils/cx.js";

/**
 * Field wraps a control with its label, hint, and validation message and wires
 * up the aria-describedby / aria-invalid relationships. Children receive the
 * generated ids so every control stays labelled without callers repeating it.
 */
export function Field({ label, hint, error, success, required, htmlFor, className, children, action }) {
  const describedBy = [hint && `${htmlFor}-hint`, error && `${htmlFor}-error`]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cx("field", className)}>
      {label && (
        <div className="field__label">
          <label htmlFor={htmlFor}>
            {label}
            {required && (
              <span className="field__required" aria-hidden="true">
                *
              </span>
            )}
          </label>
          {action}
        </div>
      )}

      {typeof children === "function"
        ? children({ id: htmlFor, describedBy: describedBy || undefined, invalid: Boolean(error) })
        : children}

      {hint && !error && (
        <p className="field__hint" id={`${htmlFor}-hint`}>
          {hint}
        </p>
      )}

      {error && (
        <p className="field__error" id={`${htmlFor}-error`} role="alert">
          <AlertCircle size={13} aria-hidden="true" />
          {error}
        </p>
      )}

      {success && !error && (
        <p className="field__success">
          <CheckCircle2 size={13} aria-hidden="true" />
          {success}
        </p>
      )}
    </div>
  );
}

/**
 * Text input with optional leading icon and trailing affix slot.
 */
export const Input = forwardRef(function Input(
  { icon: Icon, affix, invalid, className, ...rest },
  ref,
) {
  return (
    <div className="input-wrap">
      {Icon && (
        <span className="input-wrap__icon">
          <Icon size={16} aria-hidden="true" />
        </span>
      )}
      <input
        ref={ref}
        className={cx(
          "input",
          Icon && "input--with-icon",
          affix && "input--with-affix",
          className,
        )}
        aria-invalid={invalid || undefined}
        {...rest}
      />
      {affix && <span className="input-wrap__affix">{affix}</span>}
    </div>
  );
});

/**
 * Password input with a show/hide toggle. The toggle is a real button so it is
 * reachable by keyboard, and announces which state it will switch to.
 */
export const PasswordInput = forwardRef(function PasswordInput(
  { icon, invalid, ...rest },
  ref,
) {
  const [visible, setVisible] = useState(false);

  return (
    <Input
      ref={ref}
      type={visible ? "text" : "password"}
      icon={icon}
      invalid={invalid}
      affix={
        <button
          type="button"
          className="btn btn--ghost btn--sm btn--icon"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Hide password" : "Show password"}
          tabIndex={0}
        >
          {visible ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
        </button>
      }
      {...rest}
    />
  );
});

export const Textarea = forwardRef(function Textarea({ invalid, className, ...rest }, ref) {
  return (
    <textarea
      ref={ref}
      className={cx("textarea", className)}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  );
});

export const Select = forwardRef(function Select({ className, children, ...rest }, ref) {
  return (
    <select ref={ref} className={cx("select", className)} {...rest}>
      {children}
    </select>
  );
});

export function Checkbox({ label, className, ...rest }) {
  const id = useId();

  return (
    <label className={cx("checkbox", className)} htmlFor={rest.id || id}>
      <input type="checkbox" id={rest.id || id} {...rest} />
      <span>{label}</span>
    </label>
  );
}

export default Field;
