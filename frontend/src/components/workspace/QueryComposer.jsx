import { useEffect, useRef } from "react";
import { CornerDownLeft, Lightbulb, Sparkles } from "lucide-react";

import Button from "../ui/Button.jsx";
import Badge from "../ui/Badge.jsx";
import ModeSelector from "./ModeSelector.jsx";
import { MAX_TOPIC_LENGTH, MIN_TOPIC_LENGTH, MODE_BY_ID } from "../../constants/modes.js";
import { cx } from "../../utils/cx.js";

const SUGGESTIONS = [
  "Compare retrieval-augmented generation with long-context prompting for enterprise search",
  "What does current evidence say about agentic AI in software engineering workflows?",
  "Summarise the security trade-offs of on-device inference for consumer hardware",
];

/**
 * The research brief input.
 *
 * Ctrl/Cmd+Enter submits, matching the convention for multiline composers where
 * plain Enter must stay available for line breaks. The textarea auto-grows to
 * its content so a long brief is readable without an inner scrollbar, capped so
 * the submit button never leaves the viewport.
 */
export default function QueryComposer({
  topic,
  onTopicChange,
  mode,
  onModeChange,
  onSubmit,
  isLoading,
  canGenerate,
  needsDocument,
  hasDocument,
  children,
}) {
  const textareaRef = useRef(null);
  const modeMeta = MODE_BY_ID[mode];

  useEffect(() => {
    const node = textareaRef.current;
    if (!node) return;
    node.style.height = "auto";
    node.style.height = `${Math.min(node.scrollHeight, 320)}px`;
  }, [topic]);

  const length = topic.length;
  const counterState =
    length > MAX_TOPIC_LENGTH ? "over" : length > MAX_TOPIC_LENGTH * 0.9 ? "warn" : "ok";

  const handleKeyDown = (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      if (canGenerate) onSubmit(event);
    }
  };

  const blockedReason = isLoading
    ? "A run is already in progress"
    : needsDocument && !hasDocument
      ? `${modeMeta?.fullLabel} needs an indexed document`
      : topic.trim().length < MIN_TOPIC_LENGTH
        ? `Enter at least ${MIN_TOPIC_LENGTH} characters`
        : null;

  return (
    <form className="card composer" onSubmit={onSubmit}>
      <div>
        <p className="section-heading__kicker">Research brief</p>
        <h2 className="section-heading__title">What should the agents investigate?</h2>
      </div>

      <ModeSelector value={mode} onChange={onModeChange} disabled={isLoading} />

      <p
        style={{
          fontSize: "var(--text-xs)",
          color: "var(--text-secondary)",
          lineHeight: "var(--leading-snug)",
          marginTop: "calc(var(--space-2) * -1)",
        }}
      >
        {modeMeta?.description}
      </p>

      {children}

      <div className="composer__input-shell">
        <label htmlFor="research-topic" className="sr-only">
          Research topic
        </label>
        <textarea
          ref={textareaRef}
          id="research-topic"
          className="composer__textarea"
          value={topic}
          onChange={(event) => onTopicChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe what you want researched. Be specific about scope, timeframe, and the comparison you care about…"
          maxLength={MAX_TOPIC_LENGTH}
          rows={4}
          disabled={isLoading}
          aria-describedby="topic-counter"
        />

        <div className="composer__toolbar">
          <span id="topic-counter" className="composer__counter" data-state={counterState}>
            {length}/{MAX_TOPIC_LENGTH}
          </span>

          {modeMeta && (
            <Badge variant="outline" icon={modeMeta.icon}>
              {modeMeta.fullLabel}
            </Badge>
          )}

          <span className="spacer" />

          <span
            className="row"
            style={{
              gap: "var(--space-1)",
              fontSize: "var(--text-2xs)",
              color: "var(--text-tertiary)",
            }}
          >
            <kbd className="kbd">Ctrl</kbd>
            <kbd className="kbd">
              <CornerDownLeft size={10} />
            </kbd>
          </span>

          <Button
            type="submit"
            variant="gradient"
            size="md"
            loading={isLoading}
            disabled={!canGenerate}
            leadingIcon={Sparkles}
            title={blockedReason ?? "Generate report"}
          >
            {isLoading ? "Researching…" : "Generate Report"}
          </Button>
        </div>
      </div>

      {blockedReason && !isLoading && (
        <p className="field__hint" role="status">
          {blockedReason}
        </p>
      )}

      {topic.length === 0 && (
        <div>
          <p
            className={cx("row")}
            style={{
              gap: "var(--space-2)",
              fontSize: "var(--text-2xs)",
              fontWeight: 700,
              letterSpacing: "var(--tracking-caps)",
              textTransform: "uppercase",
              color: "var(--text-tertiary)",
              marginBottom: "var(--space-3)",
            }}
          >
            <Lightbulb size={13} aria-hidden="true" />
            Try one of these
          </p>
          <div className="composer__suggestions">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                className="suggestion-chip"
                onClick={() => onTopicChange(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </form>
  );
}
