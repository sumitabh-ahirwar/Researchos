import { FileText, Globe2, Layers3 } from "lucide-react";

/**
 * The three research modes the API accepts on `POST /api/research/generate`.
 * `id` values must stay `web` | `pdf` | `hybrid` — they are sent verbatim as
 * the request `mode` and are validated by the backend's ReportMode literal.
 */
export const RESEARCH_MODES = [
  {
    id: "web",
    label: "Web",
    fullLabel: "Web Research",
    icon: Globe2,
    tagline: "Live sources from across the open web",
    description:
      "Agents plan the query, search the web, scrape the pages worth reading, and synthesise a cited report.",
    requiresDocument: false,
    accent: "brand",
  },
  {
    id: "pdf",
    label: "PDF",
    fullLabel: "PDF Research",
    icon: FileText,
    tagline: "Grounded entirely in your documents",
    description:
      "Your PDF is chunked, embedded, and stored. Retrieval pulls the closest passages so every claim traces back to a page.",
    requiresDocument: true,
    accent: "success",
  },
  {
    id: "hybrid",
    label: "Hybrid",
    fullLabel: "Hybrid Research",
    icon: Layers3,
    tagline: "Your documents, checked against the web",
    description:
      "Retrieved PDF context and live web results are merged into a single evidence set before the report is written.",
    requiresDocument: true,
    accent: "gradient",
  },
];

export const MODE_BY_ID = Object.fromEntries(RESEARCH_MODES.map((mode) => [mode.id, mode]));

export function modeRequiresDocument(mode) {
  return Boolean(MODE_BY_ID[mode]?.requiresDocument);
}

export const MAX_TOPIC_LENGTH = 500;
export const MIN_TOPIC_LENGTH = 3;
