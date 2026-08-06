import { motion } from "framer-motion";
import { Check, Circle, Loader2, Minus, X } from "lucide-react";

import Badge from "../ui/Badge.jsx";
import Tooltip from "../ui/Tooltip.jsx";
import { Progress } from "../ui/Feedback.jsx";
import { AGENT_BY_LABEL, FALLBACK_AGENT, STATUS_META } from "../../constants/agents.js";
import { formatDuration } from "../../utils/format.js";

const MARKER_ICON = {
  pending: Circle,
  running: Loader2,
  completed: Check,
  failed: X,
  skipped: Minus,
};

/**
 * Vertical agent workflow.
 *
 * Each node is keyed off the `label` the API returns, which is how the icon
 * and description in constants/agents.js get attached without the backend
 * knowing about presentation.
 *
 * While a run is in flight the statuses are a client-side estimate — the
 * generate endpoint returns progress only when it resolves. That is stated in
 * the header rather than left for the user to discover, since a fabricated
 * "completed" tick would otherwise read as a fact.
 */
export default function AgentPipeline({ steps, isLoading, elapsed = 0, mode }) {
  const completed = steps.filter((step) => step.status === "completed").length;
  const total = steps.filter((step) => step.status !== "skipped").length;
  const isEstimated = isLoading && steps.some((step) => step.estimated);

  return (
    <section aria-label="Agent pipeline progress">
      <header className="pipeline__header">
        <div>
          <p className="section-heading__kicker">Agent workflow</p>
          <h2 className="section-heading__title">Pipeline</h2>
        </div>

        <div style={{ textAlign: "right" }}>
          {isLoading ? (
            <>
              <Badge variant="brand" dot pulse>
                Running
              </Badge>
              <p className="pipeline__elapsed" style={{ marginTop: 4 }}>
                {formatDuration(elapsed)} elapsed
              </p>
            </>
          ) : (
            <Badge variant={completed === total && total > 0 ? "success" : "neutral"}>
              {completed}/{total} complete
            </Badge>
          )}
        </div>
      </header>

      <div style={{ marginBottom: "var(--space-5)" }}>
        <Progress
          value={(completed / Math.max(total, 1)) * 100}
          indeterminate={isLoading}
          size="thin"
          tone={steps.some((step) => step.status === "failed") ? "danger" : "brand"}
          label="Pipeline progress"
        />
      </div>

      {isEstimated && (
        <p
          style={{
            marginBottom: "var(--space-4)",
            fontSize: "var(--text-2xs)",
            color: "var(--text-tertiary)",
            lineHeight: "var(--leading-snug)",
          }}
        >
          The API returns final status when the run completes, so stages shown while it is
          running are an estimate based on typical {mode} timings.
        </p>
      )}

      <ol className="pipeline" role="list">
        {steps.map((step) => {
          const meta = AGENT_BY_LABEL[step.label] ?? FALLBACK_AGENT;
          const status = STATUS_META[step.status] ?? STATUS_META.pending;
          const MarkerIcon = MARKER_ICON[step.status] ?? Circle;
          const StageIcon = meta.icon;

          return (
            <li className="agent-node" data-status={step.status} key={step.id ?? step.label}>
              <span className="agent-node__marker">
                {step.status === "running" ? (
                  <Loader2 className="spin" size={16} aria-hidden="true" />
                ) : step.status === "pending" ? (
                  <StageIcon size={16} aria-hidden="true" />
                ) : (
                  <MarkerIcon size={16} aria-hidden="true" strokeWidth={2.6} />
                )}
              </span>

              <div className="agent-node__content">
                <div className="agent-node__title">
                  <span className="agent-node__name">{meta.short ?? step.label}</span>

                  {step.estimated && step.status === "running" ? (
                    <Tooltip label="Estimated — the API reports status only on completion">
                      <Badge variant="outline">est.</Badge>
                    </Tooltip>
                  ) : (
                    step.status !== "pending" && (
                      <Badge variant={status.variant}>{status.label}</Badge>
                    )
                  )}
                </div>

                <p className="agent-node__message">{step.message || meta.summary}</p>

                {step.status === "running" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ marginTop: "var(--space-2)", maxWidth: 180 }}
                  >
                    <Progress indeterminate size="thin" label={`${step.label} in progress`} />
                  </motion.div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
