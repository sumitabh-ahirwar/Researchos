import { cx } from "../../utils/cx.js";

/**
 * Status pill. `dot` renders a leading indicator; `pulse` animates it for
 * in-flight states so "running" reads as live without spinning an icon.
 */
export default function Badge({
  variant = "neutral",
  size = "sm",
  dot = false,
  pulse = false,
  icon: Icon,
  className,
  children,
  ...rest
}) {
  return (
    <span
      className={cx("badge", `badge--${variant}`, size === "lg" && "badge--lg", className)}
      {...rest}
    >
      {dot && <span className={cx("badge__dot", pulse && "badge__dot--pulse")} aria-hidden="true" />}
      {Icon && <Icon size={12} aria-hidden="true" />}
      {children}
    </span>
  );
}
