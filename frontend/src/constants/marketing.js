import {
  Blocks,
  FileStack,
  GitBranch,
  Layers3,
  Lock,
  Quote,
  ScrollText,
  Search,
  ShieldCheck,
  Workflow,
  Zap,
} from "lucide-react";

export const FEATURES = [
  {
    id: "multi-agent",
    icon: Workflow,
    title: "A pipeline, not a prompt",
    description:
      "Seven specialised agents hand work to each other — planning, retrieval, analysis, drafting, and citation checking each run as their own step.",
  },
  {
    id: "rag",
    icon: FileStack,
    title: "Retrieval over your own PDFs",
    description:
      "Documents are chunked, embedded, and stored in a vector database so answers are grounded in the pages you supplied, not in model memory.",
  },
  {
    id: "hybrid",
    icon: Layers3,
    title: "Hybrid evidence",
    description:
      "Merge retrieved document context with live web results in a single run, then see exactly which source each section leaned on.",
  },
  {
    id: "citations",
    icon: ShieldCheck,
    title: "Traceable citations",
    description:
      "A dedicated checker attaches page-level references and flags claims it could not trace back to a source.",
  },
  {
    id: "critic",
    icon: Quote,
    title: "Built-in critique",
    description:
      "Every report ships with the critic agent's assessment, so you know where the draft is thin before you rely on it.",
  },
  {
    id: "export",
    icon: ScrollText,
    title: "Reports built for reading",
    description:
      "Typography tuned for long-form, a live table of contents, reading progress, and one-click Markdown or print export.",
  },
];

/**
 * Conceptual pipeline shown on the marketing page. The critic step is included
 * here because it runs inside the backend graph, even though the progress API
 * does not surface it as its own reportable step.
 */
export const PIPELINE_NODES = [
  { id: "plan", label: "Query Planner", icon: Blocks, detail: "Routes the brief" },
  { id: "search", label: "Web Search", icon: Search, detail: "Live sources" },
  { id: "retrieve", label: "PDF Retriever", icon: FileStack, detail: "Vector recall" },
  { id: "analyze", label: "Analyzer", icon: GitBranch, detail: "Cross-checks evidence" },
  { id: "write", label: "Report Writer", icon: ScrollText, detail: "Drafts the report" },
  { id: "cite", label: "Citation Checker", icon: ShieldCheck, detail: "Traces claims" },
  { id: "critique", label: "Critic", icon: Quote, detail: "Scores the draft" },
  { id: "done", label: "Final Report", icon: Zap, detail: "Ready to export" },
];

export const STATS = [
  { id: "agents", value: "7", label: "Specialised agents", detail: "per research run" },
  { id: "modes", value: "3", label: "Research modes", detail: "web, PDF, hybrid" },
  { id: "grounding", value: "100%", label: "Page-level grounding", detail: "in PDF mode" },
  { id: "export", value: "1", label: "Click to export", detail: "Markdown or print" },
];

/**
 * PLACEHOLDER COPY — these are illustrative, not real customer quotes.
 * Names, roles, and organisations are fictional. Replace before any public
 * launch; do not present them as genuine testimonials.
 */
export const TESTIMONIALS = [
  {
    id: "t1",
    quote:
      "The pipeline view is the part that sold me. Seeing which agent is running turns a black box into something I can actually debug.",
    name: "Sample Reviewer",
    role: "Research Lead",
    org: "Placeholder Labs",
  },
  {
    id: "t2",
    quote:
      "Hybrid mode is the workflow I kept building by hand — my own PDFs checked against what the web says right now.",
    name: "Sample Reviewer",
    role: "Analyst",
    org: "Placeholder Group",
  },
  {
    id: "t3",
    quote:
      "Page-level citations meant I could hand the output to someone else without re-verifying every line myself.",
    name: "Sample Reviewer",
    role: "Doctoral Researcher",
    org: "Placeholder University",
  },
];

/** PLACEHOLDER PRICING — illustrative tiers for layout purposes only. */
export const PRICING_TIERS = [
  {
    id: "free",
    name: "Explorer",
    price: "$0",
    cadence: "forever",
    description: "For trying the pipeline on your own machine.",
    features: [
      "Web, PDF, and hybrid modes",
      "Full agent pipeline",
      "Markdown export",
      "Local vector storage",
    ],
    cta: "Start researching",
    to: "/signup",
    featured: false,
  },
  {
    id: "pro",
    name: "Researcher",
    price: "$24",
    cadence: "per month",
    description: "For sustained research work across many documents.",
    features: [
      "Everything in Explorer",
      "Unlimited saved reports",
      "Priority model routing",
      "Longer document limits",
      "Report history sync",
    ],
    cta: "Choose Researcher",
    to: "/signup",
    featured: true,
  },
  {
    id: "team",
    name: "Team",
    price: "Custom",
    cadence: "talk to us",
    description: "For groups sharing a research corpus.",
    features: [
      "Everything in Researcher",
      "Shared document library",
      "Workspace roles",
      "SSO and audit trail",
      "Deployment support",
    ],
    cta: "Contact us",
    to: "/signup",
    featured: false,
  },
];

export const FAQS = [
  {
    id: "f1",
    question: "How is this different from asking a chatbot?",
    answer:
      "A chatbot answers in one pass. ResearchOS routes your brief through separate planning, retrieval, analysis, writing, and citation-checking agents, and shows you each step. When something is wrong you can see which stage produced it.",
  },
  {
    id: "f2",
    question: "What happens to the PDFs I upload?",
    answer:
      "They are stored on the server running ResearchOS, split into chunks, embedded, and indexed in a local vector store. Retrieval happens against that index, so PDF-mode reports only draw on documents you supplied.",
  },
  {
    id: "f3",
    question: "Can I use more than one PDF?",
    answer:
      "You can upload several documents and keep them in your workspace. Each report is grounded in the document you mark as active, so switch the active document to change what a run retrieves from.",
  },
  {
    id: "f4",
    question: "How long does a report take?",
    answer:
      "It depends on the mode and how much the web-search agent has to scrape. Web and hybrid runs take the longest because they fetch live pages. The workspace shows elapsed time once the run returns.",
  },
  {
    id: "f5",
    question: "Are the citations reliable?",
    answer:
      "The citation checker attaches page-level references for retrieved PDF passages and flags claims it could not trace. Treat it as a strong first pass, not a substitute for reading the sources on anything that matters.",
  },
  {
    id: "f6",
    question: "Is my research history stored anywhere?",
    answer:
      "History and saved reports live in your browser's local storage in this build. Clearing site data clears them, and they do not follow you to another device.",
  },
];

export const FOOTER_LINKS = [
  {
    id: "product",
    title: "Product",
    links: [
      { label: "Features", href: "/#features" },
      { label: "How it works", href: "/#pipeline" },
      { label: "Pricing", href: "/#pricing" },
      { label: "Workspace", href: "/app/research" },
    ],
  },
  {
    id: "resources",
    title: "Resources",
    links: [
      { label: "Help centre", href: "/app/help" },
      { label: "API reference", href: "http://127.0.0.1:8000/docs", external: true },
      { label: "FAQ", href: "/#faq" },
    ],
  },
  {
    id: "company",
    title: "Company",
    links: [
      { label: "About", href: "/#features" },
      { label: "Contact", href: "/#faq" },
      { label: "Changelog", href: "/#pipeline" },
    ],
  },
];

export const TRUST_POINTS = [
  { id: "local", icon: Lock, label: "Documents stay on your server" },
  { id: "open", icon: GitBranch, label: "Open pipeline, inspectable steps" },
  { id: "cited", icon: ShieldCheck, label: "Page-level citations" },
];
