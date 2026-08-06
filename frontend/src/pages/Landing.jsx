import { useEffect } from "react";

import MarketingNav from "../components/marketing/MarketingNav.jsx";
import Hero from "../components/marketing/Hero.jsx";
import SiteFooter from "../components/marketing/SiteFooter.jsx";
import {
  CtaBand,
  Faq,
  Features,
  PipelineDiagram,
  Pricing,
  StatsBand,
  Testimonials,
} from "../components/marketing/Sections.jsx";

/**
 * Marketing landing page.
 *
 * Ordered as a narrative: what it is (hero), proof of scope (stats), why it is
 * different (features), how it works (pipeline), social proof, pricing, then
 * objections (FAQ) before the final call to action.
 *
 * Landing pages are read in one direction, so the whole page is a single
 * scrolling document with in-page anchors rather than tabbed sections.
 */
export default function Landing() {
  useEffect(() => {
    document.title = "ResearchOS — Multi-agent research you can check";
  }, []);

  return (
    <div className="marketing">
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <MarketingNav />

      <main id="main">
        <Hero />
        <StatsBand />
        <Features />
        <PipelineDiagram />
        <Testimonials />
        <Pricing />
        <Faq />
        <CtaBand />
      </main>

      <SiteFooter />
    </div>
  );
}
