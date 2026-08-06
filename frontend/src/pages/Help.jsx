import { ExternalLink, Keyboard } from "lucide-react";

import Accordion from "../components/ui/Accordion.jsx";
import Button from "../components/ui/Button.jsx";
import Card, { CardBody, CardHeader, CardTitle } from "../components/ui/Card.jsx";
import Badge from "../components/ui/Badge.jsx";
import { AGENT_STEPS } from "../constants/agents.js";
import { RESEARCH_MODES } from "../constants/modes.js";
import { FAQS } from "../constants/marketing.js";

const STEPS = [
  {
    title: "Pick a research mode",
    desc: "Web searches live sources. PDF grounds everything in a document you upload. Hybrid merges both.",
  },
  {
    title: "Upload documents (PDF and hybrid only)",
    desc: "Drop PDFs into the workspace. Each is chunked, embedded, and indexed. Mark one as active — a run is grounded in the active document.",
  },
  {
    title: "Write a specific brief",
    desc: "Scope, timeframe, and the comparison you care about produce better reports than a bare keyword.",
  },
  {
    title: "Read the pipeline",
    desc: "Each agent shows its status. While a run is in flight the stages are an estimate — the API reports final status only when it resolves.",
  },
  {
    title: "Verify and export",
    desc: "Check the citation cards and critic feedback, then copy, download as Markdown, or print to PDF.",
  },
];

const SHORTCUTS = [
  { keys: ["Ctrl", "K"], action: "Open command palette" },
  { keys: ["Ctrl", "Enter"], action: "Run research from the composer" },
  { keys: ["Esc"], action: "Close dialog, palette, or fullscreen" },
  { keys: ["↑", "↓"], action: "Move through palette results" },
];

/** Help — how the pipeline behaves and what its limits are. */
export default function Help() {
  return (
    <div className="help-layout">
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h2 className="page-header__title">Help</h2>
          <p className="page-header__subtitle">
            How the agent pipeline works, what each mode does, and where its edges are.
          </p>
        </div>
        <Button
          href="http://127.0.0.1:8000/docs"
          target="_blank"
          rel="noreferrer"
          variant="secondary"
          trailingIcon={ExternalLink}
        >
          API reference
        </Button>
      </div>

      {/* Getting started --------------------------------------------------- */}
      <Card>
        <CardHeader>
          <CardTitle>Getting started</CardTitle>
        </CardHeader>
        <CardBody>
          <ol className="help-steps" role="list">
            {STEPS.map((step, index) => (
              <li className="help-step" key={step.title}>
                <span className="help-step__number" aria-hidden="true">
                  {index + 1}
                </span>
                <div>
                  <p className="help-step__title">{step.title}</p>
                  <p className="help-step__desc">{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </CardBody>
      </Card>

      {/* Modes ------------------------------------------------------------- */}
      <Card>
        <CardHeader>
          <CardTitle>Research modes</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="stack" style={{ gap: "var(--space-5)" }}>
            {RESEARCH_MODES.map((mode) => (
              <div key={mode.id} className="row" style={{ alignItems: "flex-start" }}>
                <span className="icon-tile icon-tile--md" aria-hidden="true">
                  <mode.icon size={19} />
                </span>
                <div>
                  <p className="row" style={{ gap: "var(--space-2)" }}>
                    <strong style={{ fontSize: "var(--text-base)" }}>{mode.fullLabel}</strong>
                    {mode.requiresDocument && <Badge variant="warning">Needs a document</Badge>}
                  </p>
                  <p
                    style={{
                      marginTop: "var(--space-1)",
                      fontSize: "var(--text-sm)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {mode.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Agents ------------------------------------------------------------ */}
      <Card>
        <CardHeader>
          <CardTitle>What each agent does</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Agent</th>
                  <th scope="col">Responsibility</th>
                  <th scope="col">Runs in</th>
                </tr>
              </thead>
              <tbody>
                {AGENT_STEPS.filter((step) => step.label !== "Completed").map((step) => (
                  <tr key={step.id}>
                    <th scope="row" style={{ background: "transparent", textTransform: "none" }}>
                      <span className="row" style={{ gap: "var(--space-2)" }}>
                        <step.icon size={15} aria-hidden="true" />
                        <span style={{ color: "var(--text-primary)", fontSize: "var(--text-sm)" }}>
                          {step.short}
                        </span>
                      </span>
                    </th>
                    <td>{step.summary}</td>
                    <td>
                      <span className="row" style={{ gap: "var(--space-1)" }}>
                        {step.modes.map((modeId) => (
                          <Badge key={modeId} variant="outline">
                            {modeId}
                          </Badge>
                        ))}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* Shortcuts --------------------------------------------------------- */}
      <Card>
        <CardHeader>
          <div className="row" style={{ gap: "var(--space-3)" }}>
            <span className="icon-tile icon-tile--md" aria-hidden="true">
              <Keyboard size={19} />
            </span>
            <CardTitle>Keyboard shortcuts</CardTitle>
          </div>
        </CardHeader>
        <CardBody>
          <div className="stack" style={{ gap: "var(--space-3)" }}>
            {SHORTCUTS.map((shortcut) => (
              <div className="row-between" key={shortcut.action}>
                <span style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>
                  {shortcut.action}
                </span>
                <span className="row" style={{ gap: "var(--space-1)" }}>
                  {shortcut.keys.map((key) => (
                    <kbd className="kbd" key={key}>
                      {key}
                    </kbd>
                  ))}
                </span>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* FAQ --------------------------------------------------------------- */}
      <section>
        <h3 className="section-block__title" style={{ marginBottom: "var(--space-4)" }}>
          Frequently asked
        </h3>
        <Accordion items={FAQS} allowMultiple />
      </section>
    </div>
  );
}
