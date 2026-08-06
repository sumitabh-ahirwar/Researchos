import { forwardRef } from "react";

import { cx } from "../../utils/cx.js";

/**
 * Surface container. `interactive` adds hover lift plus the keyboard/role
 * plumbing a clickable card needs to stay operable without a mouse.
 */
const Card = forwardRef(function Card(
  { variant = "default", interactive = false, as: Tag = "div", className, children, onClick, ...rest },
  ref,
) {
  const interactiveProps =
    interactive && Tag === "div"
      ? {
          role: "button",
          tabIndex: 0,
          onKeyDown: (event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onClick?.(event);
            }
            rest.onKeyDown?.(event);
          },
        }
      : {};

  return (
    <Tag
      ref={ref}
      className={cx(
        "card",
        variant !== "default" && `card--${variant}`,
        interactive && "card--interactive",
        className,
      )}
      onClick={onClick}
      {...interactiveProps}
      {...rest}
    >
      {children}
    </Tag>
  );
});

export function CardHeader({ className, children, ...rest }) {
  return (
    <div className={cx("card__header", className)} {...rest}>
      {children}
    </div>
  );
}

export function CardBody({ className, children, ...rest }) {
  return (
    <div className={cx("card__body", className)} {...rest}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...rest }) {
  return (
    <div className={cx("card__footer", className)} {...rest}>
      {children}
    </div>
  );
}

export function CardTitle({ as: Tag = "h3", className, children, ...rest }) {
  return (
    <Tag className={cx("card__title", className)} {...rest}>
      {children}
    </Tag>
  );
}

export function CardDescription({ className, children, ...rest }) {
  return (
    <p className={cx("card__desc", className)} {...rest}>
      {children}
    </p>
  );
}

export default Card;
