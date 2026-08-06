import { forwardRef } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { cx } from "../../utils/cx.js";

/**
 * Polymorphic button.
 *
 * Renders a <button>, a react-router <Link> (via `to`), or an <a> (via `href`)
 * while keeping one visual contract. Loading state keeps the button's width
 * stable and marks it busy for assistive tech instead of swapping the label out.
 */
const Button = forwardRef(function Button(
  {
    variant = "primary",
    size = "md",
    iconOnly = false,
    block = false,
    loading = false,
    leadingIcon: LeadingIcon,
    trailingIcon: TrailingIcon,
    className,
    children,
    to,
    href,
    disabled,
    type = "button",
    ...rest
  },
  ref,
) {
  const classes = cx(
    "btn",
    `btn--${variant}`,
    `btn--${size}`,
    iconOnly && "btn--icon",
    block && "btn--block",
    className,
  );

  const content = (
    <>
      {loading ? (
        <Loader2 className="spin" size={size === "lg" ? 19 : 16} aria-hidden="true" />
      ) : (
        LeadingIcon && <LeadingIcon size={size === "lg" ? 19 : 16} aria-hidden="true" />
      )}
      {!iconOnly && children}
      {!loading && TrailingIcon && (
        <TrailingIcon size={size === "lg" ? 19 : 16} aria-hidden="true" />
      )}
    </>
  );

  if (to) {
    return (
      <Link ref={ref} to={to} className={classes} {...rest}>
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <a ref={ref} href={href} className={classes} {...rest}>
        {content}
      </a>
    );
  }

  return (
    <button
      ref={ref}
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {content}
    </button>
  );
});

export default Button;
