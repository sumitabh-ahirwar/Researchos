import {
  BadgeCheck,
  Brain,
  CheckCircle2,
  FileSearch,
  Globe2,
  Microscope,
  PenLine,
  ShieldCheck,
} from "lucide-react";

/**
 * Canonical agent pipeline.
 *
 * The `label` values mirror `STEP_LABELS` in backend/services/pipeline_service.py
 * exactly — the API returns progress keyed by those strings, so this list is
 * what lets the UI attach an icon and description to each returned step
 * without the backend needing to know anything about presentation.
 */
export const AGENT_STEPS = [
  {
    id: 1,
    label: "Query Planner Agent",
    short: "Planner",
    icon: Brain,
    summary: "Interprets the brief and routes it to the right research workflow.",
    idleMessage: "Waiting for a topic and mode.",
    modes: ["web", "pdf", "hybrid"],
  },
  {
    id: 2,
    label: "PDF Retriever Agent",
    short: "Retriever",
    icon: FileSearch,
    summary: "Embeds the query and pulls the closest chunks from the vector store.",
    idleMessage: "Retrieves relevant chunks when PDF mode is active.",
    modes: ["pdf", "hybrid"],
  },
  {
    id: 3,
    label: "Web Search Agent",
    short: "Web Search",
    icon: Globe2,
    summary: "Runs live search and scrapes the pages worth reading.",
    idleMessage: "Runs Tavily and scraping when web research is active.",
    modes: ["web", "hybrid"],
  },
  {
    id: 4,
    label: "Analyzer Agent",
    short: "Analyzer",
    icon: Microscope,
    summary: "Compares evidence across sources and flags the gaps.",
    idleMessage: "Compares evidence and identifies gaps.",
    modes: ["web", "pdf", "hybrid"],
  },
  {
    id: 5,
    label: "Report Writer Agent",
    short: "Writer",
    icon: PenLine,
    summary: "Drafts the structured report grounded in retrieved context.",
    idleMessage: "Creates a grounded final report.",
    modes: ["web", "pdf", "hybrid"],
  },
  {
    id: 6,
    label: "Citation Checker Agent",
    short: "Citations",
    icon: ShieldCheck,
    summary: "Traces every claim back to a source and attaches references.",
    idleMessage: "Checks PDF source traceability.",
    modes: ["web", "pdf", "hybrid"],
  },
  {
    id: 7,
    label: "Completed",
    short: "Complete",
    icon: CheckCircle2,
    summary: "The report is ready to read, export, and save.",
    idleMessage: "The final report will be ready.",
    modes: ["web", "pdf", "hybrid"],
  },
];

/** Lookup by the exact backend label, with a safe fallback for unknown steps. */
export const AGENT_BY_LABEL = Object.fromEntries(
  AGENT_STEPS.map((step) => [step.label, step]),
);

export const FALLBACK_AGENT = {
  icon: BadgeCheck,
  short: "Agent",
  summary: "",
};

/**
 * Base progress list used before the first request returns. Shape matches the
 * `ProgressStep` schema the API responds with so both sources render identically.
 */
export const BASE_PROGRESS_STEPS = AGENT_STEPS.map((step) => ({
  id: step.id,
  label: step.label,
  status: "pending",
  message: step.idleMessage,
}));

export const STATUS_META = {
  pending: { label: "Pending", variant: "neutral", tone: "neutral" },
  running: { label: "Running", variant: "brand", tone: "brand" },
  completed: { label: "Completed", variant: "success", tone: "success" },
  failed: { label: "Failed", variant: "danger", tone: "danger" },
  // Client-side only: an agent the selected mode does not exercise at all.
  skipped: { label: "Not used", variant: "outline", tone: "neutral" },
};

/** Agents that actually participate in a given mode, for the workspace diagram. */
export function agentsForMode(mode) {
  return AGENT_STEPS.filter((step) => step.modes.includes(mode));
}
