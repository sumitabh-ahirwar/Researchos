import { useEffect, useMemo, useState } from "react";

import { BASE_PROGRESS_STEPS } from "../constants/agents.js";
import { modeRequiresDocument } from "../constants/modes.js";

/**
 * Presentation-only progress estimate.
 *
 * `POST /api/research/generate` is a single blocking call — it returns the
 * full progress list at the end and streams nothing in between. There is
 * therefore no true live status to display while a run is in flight.
 *
 * Rather than freeze the timeline or assert that agents finished when we
 * cannot know that, this advances a best-guess cursor on a timer and the UI
 * labels the result as an estimate. Two rules keep it honest:
 *
 *   1. Steps that do not run in the selected mode are marked `skipped`, never
 *      `completed` — web runs do not touch the PDF retriever.
 *   2. The terminal "Completed" step is never marked complete by the estimate.
 *      Only the real response can do that.
 *
 * Once the request resolves, `serverSteps` takes over verbatim.
 */

/** Rough seconds each stage tends to occupy, used only for pacing the cursor. */
const STAGE_WEIGHTS = {
  "Query Planner Agent": 3,
  "PDF Retriever Agent": 5,
  "Web Search Agent": 22,
  "Analyzer Agent": 12,
  "Report Writer Agent": 26,
  "Citation Checker Agent": 8,
};

export default function useEstimatedProgress({ isLoading, mode, serverSteps }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      setElapsed(0);
      return undefined;
    }

    const startedAt = Date.now();
    const interval = setInterval(() => setElapsed((Date.now() - startedAt) / 1000), 400);
    return () => clearInterval(interval);
  }, [isLoading]);

  return useMemo(() => {
    if (!isLoading) return serverSteps ?? BASE_PROGRESS_STEPS;

    const usesPdf = modeRequiresDocument(mode);
    const usesWeb = mode === "web" || mode === "hybrid";

    const isSkipped = (label) =>
      (label === "PDF Retriever Agent" && !usesPdf) ||
      (label === "Web Search Agent" && !usesWeb);

    // Walk the stages, accumulating their weights, to find where we probably are.
    let cursor = 0;
    let budget = 0;
    const active = BASE_PROGRESS_STEPS.filter(
      (step) => step.label !== "Completed" && !isSkipped(step.label),
    );

    for (let index = 0; index < active.length; index += 1) {
      budget += STAGE_WEIGHTS[active[index].label] ?? 10;
      if (elapsed < budget) {
        cursor = index;
        break;
      }
      // Past the last stage: hold on the writer rather than claiming we finished.
      cursor = active.length - 1;
    }

    const runningLabel = active[cursor]?.label;

    return BASE_PROGRESS_STEPS.map((step) => {
      if (isSkipped(step.label)) {
        return {
          ...step,
          status: "skipped",
          message: `Not used in ${mode} mode.`,
          estimated: true,
        };
      }

      if (step.label === "Completed") {
        return { ...step, status: "pending", message: step.message, estimated: true };
      }

      const position = active.findIndex((entry) => entry.label === step.label);

      if (step.label === runningLabel) {
        return { ...step, status: "running", estimated: true };
      }

      return {
        ...step,
        status: position < cursor ? "completed" : "pending",
        estimated: true,
      };
    });
  }, [isLoading, mode, serverSteps, elapsed]);
}
