import { Fragment } from "react";
import { ArrowRight, Check, ChevronRight, Quote } from "lucide-react";

import Reveal from "./Reveal.jsx";
import Button from "../ui/Button.jsx";
import Badge from "../ui/Badge.jsx";
import Accordion from "../ui/Accordion.jsx";
import { Avatar, IconTile } from "../ui/Feedback.jsx";
import {
  FAQS,
  FEATURES,
  PIPELINE_NODES,
  PRICING_TIERS,
  STATS,
  TESTIMONIALS,
} from "../../constants/marketing.js";

/** Shared section heading. */
function SectionHead({ eyebrow, title, lead, id }) {
  return (
    <Reveal className="section__head">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 className="section__title" id={id}>
        {title}
      </h2>
      {lead && <p className="section__lead">{lead}</p>}
    </Reveal>
  );
}

/* ------------------------------------------------------------------------- */

export function StatsBand() {
  return (
    <section className="section--tight">
      <div className="container">
        <Reveal className="stat-band">
          {STATS.map((stat) => (
            <div className="stat-band__item" key={stat.id}>
              <p className="stat-band__value">{stat.value}</p>
              <p className="stat-band__label">{stat.label}</p>
              <p className="stat-band__detail">{stat.detail}</p>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------------- */

export function Features() {
  return (
    <section className="section" id="features" aria-labelledby="features-title">
      <div className="container">
        <SectionHead
          id="features-title"
          eyebrow="Why it's different"
          title="A research system, not a chat box"
          lead="Each stage is a separate agent with a separate job, so you can see where an answer came from — and where it didn't."
        />

        <div className="feature-grid">
          {FEATURES.map((feature, index) => (
            <Reveal key={feature.id} delay={index * 0.05}>
              <article className="feature-card">
                <IconTile icon={feature.icon} size="lg" />
                <h3 className="feature-card__title">{feature.title}</h3>
                <p className="feature-card__desc">{feature.description}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------------- */

/**
 * Pipeline diagram.
 *
 * Horizontal on wide screens and horizontally scrollable below that — the
 * sequence is the message, so it stays a sequence rather than reflowing into a
 * grid where the order stops reading left-to-right.
 */
export function PipelineDiagram() {
  return (
    <section className="section" id="pipeline" aria-labelledby="pipeline-title">
      <div className="container">
        <SectionHead
          id="pipeline-title"
          eyebrow="How it works"
          title="Eight stages, all visible"
          lead="Your brief moves through the pipeline one agent at a time. When something looks wrong, you can see which stage produced it."
        />

        <Reveal>
          <div className="pipeline-flow scroll-x" role="list">
            {PIPELINE_NODES.map((node, index) => (
              <Fragment key={node.id}>
                <div className="pipeline-flow__node" role="listitem">
                  <span className="pipeline-flow__icon" aria-hidden="true">
                    <node.icon size={20} strokeWidth={1.9} />
                  </span>
                  <span className="pipeline-flow__label">{node.label}</span>
                  <span className="pipeline-flow__detail">{node.detail}</span>
                </div>
                {index < PIPELINE_NODES.length - 1 && (
                  <ChevronRight className="pipeline-flow__arrow" size={18} aria-hidden="true" />
                )}
              </Fragment>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <p
            style={{
              marginTop: "var(--space-6)",
              textAlign: "center",
              fontSize: "var(--text-sm)",
              color: "var(--text-tertiary)",
            }}
          >
            The retriever only runs in PDF and hybrid modes; web search only in web and hybrid.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------------- */

export function Testimonials() {
  return (
    <section className="section" aria-labelledby="testimonials-title">
      <div className="container">
        <SectionHead
          id="testimonials-title"
          eyebrow="Feedback"
          title="What people say"
          lead="Placeholder quotes shown for layout — this build has no published customer testimonials."
        />

        <div className="testimonial-grid">
          {TESTIMONIALS.map((entry, index) => (
            <Reveal key={entry.id} delay={index * 0.06}>
              <figure className="testimonial">
                <Quote size={20} aria-hidden="true" style={{ color: "var(--brand-300)" }} />
                <blockquote className="testimonial__quote">{entry.quote}</blockquote>
                <figcaption className="testimonial__author">
                  <Avatar name={entry.name} size="sm" />
                  <div>
                    <p className="testimonial__name">{entry.name}</p>
                    <p className="testimonial__role">
                      {entry.role}, {entry.org}
                    </p>
                  </div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------------- */

export function Pricing() {
  return (
    <section className="section" id="pricing" aria-labelledby="pricing-title">
      <div className="container">
        <SectionHead
          id="pricing-title"
          eyebrow="Pricing"
          title="Illustrative plans"
          lead="Placeholder tiers — billing is not implemented in this build. Every mode is available when you run ResearchOS yourself."
        />

        <div className="pricing-grid">
          {PRICING_TIERS.map((tier, index) => (
            <Reveal key={tier.id} delay={index * 0.06}>
              <div className="price-card" data-featured={tier.featured}>
                {tier.featured && (
                  <span className="price-card__badge">
                    <Badge variant="brand" size="lg">
                      Most popular
                    </Badge>
                  </span>
                )}

                <div>
                  <p className="price-card__name">{tier.name}</p>
                  <p className="price-card__desc" style={{ marginTop: "var(--space-2)" }}>
                    {tier.description}
                  </p>
                </div>

                <p className="price-card__price">
                  {tier.price}
                  <span className="price-card__cadence">{tier.cadence}</span>
                </p>

                <ul className="price-card__features" role="list">
                  {tier.features.map((feature) => (
                    <li className="price-card__feature" key={feature}>
                      <Check size={15} aria-hidden="true" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  to={tier.to}
                  variant={tier.featured ? "gradient" : "secondary"}
                  block
                  size="md"
                >
                  {tier.cta}
                </Button>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------------- */

export function Faq() {
  return (
    <section className="section" id="faq" aria-labelledby="faq-title">
      <div className="container" style={{ maxWidth: 760 }}>
        <SectionHead id="faq-title" eyebrow="FAQ" title="Questions, answered plainly" />
        <Reveal>
          <Accordion items={FAQS} defaultOpen={["f1"]} />
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------------- */

export function CtaBand() {
  return (
    <section className="section--tight">
      <div className="container">
        <Reveal className="cta-band">
          <h2 className="cta-band__title">Run your first report in a minute</h2>
          <p className="cta-band__lead">
            No setup beyond the backend you already have running. Pick a mode, write a brief, and
            watch the pipeline work.
          </p>
          <div className="hero__actions">
            <Button to="/app/research" variant="secondary" size="lg" trailingIcon={ArrowRight}>
              Open the workspace
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
