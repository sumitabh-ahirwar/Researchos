import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";

import { cx } from "../../utils/cx.js";

/* -------------------------------------------------------------------------
   Skeleton
   ------------------------------------------------------------------------- */

/**
 * Shimmer placeholder. Marked aria-hidden because the surrounding region
 * already announces its busy state — the bars themselves are decorative.
 */
export function Skeleton({ variant = "block", width, height, className, style, ...rest }) {
  return (
    <div
      className={cx("skeleton", variant !== "block" && `skeleton--${variant}`, className)}
      style={{ width, height, ...style }}
      aria-hidden="true"
      {...rest}
    />
  );
}

export function SkeletonText({ lines = 3, className }) {
  return (
    <div className={cx("stack", className)} style={{ gap: "var(--space-3)" }}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          variant="text"
          height={12}
          width={index === lines - 1 ? "62%" : "100%"}
        />
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------
   Empty state
   ------------------------------------------------------------------------- */

export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cx("empty-state", className)}>
      {Icon && (
        <div className="empty-state__icon">
          <Icon size={28} aria-hidden="true" strokeWidth={1.75} />
        </div>
      )}
      {title && <h3 className="empty-state__title">{title}</h3>}
      {description && <p className="empty-state__desc">{description}</p>}
      {action}
    </div>
  );
}

/* -------------------------------------------------------------------------
   Alert
   ------------------------------------------------------------------------- */

const ALERT_ICONS = {
  danger: XCircle,
  warning: AlertTriangle,
  success: CheckCircle2,
  info: Info,
};

export function Alert({ variant = "info", title, children, className, action, ...rest }) {
  const Icon = ALERT_ICONS[variant] ?? Info;

  return (
    <div
      className={cx("alert", `alert--${variant}`, className)}
      role={variant === "danger" ? "alert" : "status"}
      {...rest}
    >
      <Icon size={17} aria-hidden="true" />
      <div className="alert__body">
        {title && <p className="alert__title">{title}</p>}
        {children}
      </div>
      {action}
    </div>
  );
}

/* -------------------------------------------------------------------------
   Progress
   ------------------------------------------------------------------------- */

export function Progress({
  value = 0,
  max = 100,
  size = "default",
  tone = "brand",
  indeterminate = false,
  label,
  className,
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div
      className={cx(
        "progress",
        size !== "default" && `progress--${size}`,
        indeterminate && "progress--indeterminate",
        className,
      )}
      role="progressbar"
      aria-valuenow={indeterminate ? undefined : Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className={cx("progress__bar", tone !== "brand" && `progress__bar--${tone}`)}
        style={indeterminate ? undefined : { width: `${pct}%` }}
      />
    </div>
  );
}

export function ProgressRing({ value = 0, size = 44, stroke = 4, label }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;

  return (
    <svg
      className="progress-ring"
      width={size}
      height={size}
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <circle
        className="progress-ring__track"
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={stroke}
      />
      <circle
        className="progress-ring__fill"
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
      />
    </svg>
  );
}

/* -------------------------------------------------------------------------
   Avatar / icon tile
   ------------------------------------------------------------------------- */

export function Avatar({ name = "", src, size = "md", className, ...rest }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cx("avatar", `avatar--${size}`, className)}
        {...rest}
      />
    );
  }

  return (
    <span className={cx("avatar", `avatar--${size}`, className)} aria-hidden="true" {...rest}>
      {initials || "?"}
    </span>
  );
}

export function IconTile({ icon: Icon, tone = "brand", size = "md", className, ...rest }) {
  const glyphSize = size === "lg" ? 24 : size === "sm" ? 16 : 20;

  return (
    <span
      className={cx("icon-tile", tone !== "brand" && `icon-tile--${tone}`, `icon-tile--${size}`, className)}
      aria-hidden="true"
      {...rest}
    >
      <Icon size={glyphSize} strokeWidth={1.9} />
    </span>
  );
}
