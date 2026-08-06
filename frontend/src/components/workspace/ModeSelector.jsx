import { CheckCircle2 } from "lucide-react";

import { RESEARCH_MODES } from "../../constants/modes.js";

/**
 * Research mode picker.
 *
 * Built as a radiogroup rather than tabs: choosing a mode changes what the
 * next request does, it does not switch between views. Arrow keys move the
 * selection, which is the expected behaviour for radios and keeps the whole
 * group a single tab stop.
 */
export default function ModeSelector({ value, onChange, disabled = false }) {
  const handleKeyDown = (event, index) => {
    const keys = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"];
    if (!keys.includes(event.key)) return;

    event.preventDefault();
    const forward = event.key === "ArrowRight" || event.key === "ArrowDown";
    const next =
      (index + (forward ? 1 : -1) + RESEARCH_MODES.length) % RESEARCH_MODES.length;
    onChange(RESEARCH_MODES[next].id);
  };

  return (
    <div className="mode-grid" role="radiogroup" aria-label="Research mode">
      {RESEARCH_MODES.map((mode, index) => {
        const Icon = mode.icon;
        const selected = value === mode.id;

        return (
          <button
            key={mode.id}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            className="mode-card"
            disabled={disabled}
            onClick={() => onChange(mode.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            {selected && (
              <CheckCircle2 className="mode-card__check" size={16} aria-hidden="true" />
            )}
            <span className="mode-card__head">
              <Icon size={17} aria-hidden="true" />
              {mode.label}
            </span>
            <span className="mode-card__tagline">{mode.tagline}</span>
          </button>
        );
      })}
    </div>
  );
}
