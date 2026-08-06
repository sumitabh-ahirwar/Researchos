import { useId, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

import { cx } from "../../utils/cx.js";

/**
 * Disclosure list. `allowMultiple` switches between accordion (one open) and
 * independent disclosures. Panels animate on height so long answers do not
 * snap the page, and each trigger owns aria-expanded / aria-controls.
 */
export default function Accordion({ items, allowMultiple = false, defaultOpen = [], className }) {
  const [openIds, setOpenIds] = useState(defaultOpen);
  const baseId = useId();

  const toggle = (id) => {
    setOpenIds((current) => {
      if (current.includes(id)) return current.filter((entry) => entry !== id);
      return allowMultiple ? [...current, id] : [id];
    });
  };

  return (
    <div className={cx("accordion", className)}>
      {items.map((item) => {
        const isOpen = openIds.includes(item.id);
        const triggerId = `${baseId}-trigger-${item.id}`;
        const panelId = `${baseId}-panel-${item.id}`;

        return (
          <div className="accordion__item" key={item.id} data-open={isOpen}>
            <h3>
              <button
                type="button"
                id={triggerId}
                className="accordion__trigger"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(item.id)}
              >
                <span>{item.question ?? item.title}</span>
                <ChevronDown className="accordion__chevron" size={18} aria-hidden="true" />
              </button>
            </h3>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key="panel"
                  id={panelId}
                  role="region"
                  aria-labelledby={triggerId}
                  className="accordion__panel"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="accordion__content">{item.answer ?? item.content}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
