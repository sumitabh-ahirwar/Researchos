import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, Loader2, Play, Sparkles } from "lucide-react";

import Button from "../ui/Button.jsx";
import { TRUST_POINTS } from "../../constants/marketing.js";
import { AGENT_STEPS } from "../../constants/agents.js";

const DEMO_QUERY = "Compare RAG and long-context prompting for enterprise search";
const DEMO_AGENTS = AGENT_STEPS.slice(0, 6);

/**
 * Animated product preview.
 *
 * Types out a sample brief, then walks the agent list. This is an illustration
 * of the workflow, not live data — it runs entirely from a local timer and
 * never touches the API. It stops after one pass rather than looping forever,
 * because a permanently animating hero is a distraction once read.
 */
function ProductPreview() {
  const reduced = useReducedMotion();
  const [typed, setTyped] = useState(reduced ? DEMO_QUERY : "");
  const [stage, setStage] = useState(reduced ? DEMO_AGENTS.length : -1);

  useEffect(() => {
    if (reduced) return undefined;

    let index = 0;
    const typer = setInterval(() => {
      index += 1;
      setTyped(DEMO_QUERY.slice(0, index));
      if (index >= DEMO_QUERY.length) {
        clearInterval(typer);
        setStage(0);
      }
    }, 34);

    return () => clearInterval(typer);
  }, [reduced]);

  useEffect(() => {
    if (reduced || stage < 0 || stage >= DEMO_AGENTS.length) return undefined;
    const timer = setTimeout(() => setStage((current) => current + 1), 620);
    return () => clearTimeout(timer);
  }, [stage, reduced]);

  return (
    <motion.div
      className="preview"
      initial={reduced ? false : { opacity: 0, y: 32, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
      aria-hidden="true"
    >
      <div className="preview__chrome">
        <span className="preview__dot" />
        <span className="preview__dot" />
        <span className="preview__dot" />
        <span className="preview__url">researchos.app/workspace</span>
      </div>

      <div className="preview__body">
        <div>
          <div className="preview__query">
            {typed}
            {typed.length < DEMO_QUERY.length && <span className="preview__caret" />}
          </div>

          <div className="preview__lines">
            {[100, 94, 88, 96, 72, 90, 60].map((width, index) => (
              <motion.div
                key={index}
                className="preview__line"
                style={{ width: `${width}%` }}
                initial={reduced ? false : { opacity: 0 }}
                animate={{ opacity: stage > index / 2 ? 1 : 0.25 }}
                transition={{ duration: 0.4 }}
              />
            ))}
          </div>
        </div>

        <div className="preview__agents">
          {DEMO_AGENTS.map((agent, index) => {
            const state = stage > index ? "done" : stage === index ? "active" : "idle";

            return (
              <div className="preview__agent" data-state={state} key={agent.id}>
                <span className="preview__agent-dot">
                  {state === "done" ? (
                    <Check size={9} strokeWidth={3.5} />
                  ) : state === "active" ? (
                    <Loader2 size={9} className="spin" />
                  ) : null}
                </span>
                {agent.short}
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Hero.
 *
 * The headline carries the product's one differentiator — a visible pipeline
 * rather than a single opaque answer — instead of a generic "AI-powered"
 * claim. Background glows are purely decorative, sit behind a z-index of -1,
 * and are excluded from the accessibility tree.
 */
export default function Hero() {
  const reduced = useReducedMotion();

  const rise = (delay) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] },
        };

  return (
    <section className="hero">
      <div className="hero__bg" aria-hidden="true">
        <div className="hero__grid" />
        <div className="hero__glow hero__glow--one" />
        <div className="hero__glow hero__glow--two" />
        <div className="hero__glow hero__glow--three" />
      </div>

      <div className="container">
        <motion.p className="hero__pill" {...rise(0)}>
          <Sparkles size={13} aria-hidden="true" style={{ color: "var(--text-brand)" }} />
          Seven agents. One cited report.
        </motion.p>

        <motion.h1 className="hero__title" {...rise(0.08)}>
          Research you can
          <br />
          <span className="text-gradient">actually check</span>
        </motion.h1>

        <motion.p className="hero__lead" {...rise(0.16)}>
          ResearchOS routes your question through a pipeline of specialised agents — planning,
          retrieval, analysis, writing, and citation checking — over the live web, your own PDFs,
          or both. Every step is visible, and every claim traces back to a source.
        </motion.p>

        <motion.div className="hero__actions" {...rise(0.24)}>
          <Button to="/app/research" variant="gradient" size="lg" trailingIcon={ArrowRight}>
            Start researching
          </Button>
          <Button href="#pipeline" variant="secondary" size="lg" leadingIcon={Play}>
            See how it works
          </Button>
        </motion.div>

        <motion.div className="hero__trust" {...rise(0.32)}>
          {TRUST_POINTS.map((point) => (
            <span className="hero__trust-item" key={point.id}>
              <point.icon size={14} aria-hidden="true" />
              {point.label}
            </span>
          ))}
        </motion.div>

        <ProductPreview />
      </div>
    </section>
  );
}
