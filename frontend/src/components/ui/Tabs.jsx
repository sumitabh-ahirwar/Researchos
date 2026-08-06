import { useId, useRef } from "react";
import { motion } from "framer-motion";

import { cx } from "../../utils/cx.js";

/**
 * Tab list following the WAI-ARIA tabs pattern: roving tabindex, arrow-key
 * navigation, Home/End jumps. The active pill is a shared `layoutId` element
 * so Framer Motion slides it between triggers instead of cross-fading.
 */
export default function Tabs({
  items,
  value,
  onChange,
  variant = "pill",
  ariaLabel = "Tabs",
  className,
}) {
  const groupId = useId();
  const refs = useRef([]);

  const handleKeyDown = (event, index) => {
    const lastIndex = items.length - 1;
    let next = null;

    if (event.key === "ArrowRight") next = index === lastIndex ? 0 : index + 1;
    else if (event.key === "ArrowLeft") next = index === 0 ? lastIndex : index - 1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = lastIndex;

    if (next === null) return;

    event.preventDefault();
    onChange(items[next].id);
    refs.current[next]?.focus();
  };

  return (
    <div
      className={cx("tabs", variant === "underline" && "tabs--underline", className)}
      role="tablist"
      aria-label={ariaLabel}
    >
      {items.map((item, index) => {
        const Icon = item.icon;
        const selected = value === item.id;

        return (
          <button
            key={item.id}
            ref={(node) => {
              refs.current[index] = node;
            }}
            type="button"
            role="tab"
            id={`${groupId}-tab-${item.id}`}
            className="tabs__trigger"
            aria-selected={selected}
            aria-controls={item.panelId}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            {selected && (
              <motion.span
                layoutId={`${groupId}-indicator`}
                className="tabs__indicator"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            {Icon && <Icon size={16} aria-hidden="true" />}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
