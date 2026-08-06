import { useEffect } from "react";
import { Compass, Home, Sparkles } from "lucide-react";

import Button from "../components/ui/Button.jsx";
import Logo from "../components/shell/Logo.jsx";
import { EmptyState } from "../components/ui/Feedback.jsx";

/** 404 — offers the two destinations that are actually useful from here. */
export default function NotFound() {
  useEffect(() => {
    document.title = "Page not found — ResearchOS";
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "var(--space-8)",
      }}
    >
      <div style={{ width: "min(520px, 100%)", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "var(--space-8)" }}>
          <Logo size="lg" />
        </div>

        <div className="card">
          <EmptyState
            icon={Compass}
            title="We couldn't find that page"
            description="The link may be out of date, or the report it pointed to is no longer in this browser's library."
            action={
              <div className="row" style={{ justifyContent: "center", flexWrap: "wrap" }}>
                <Button to="/" variant="secondary" leadingIcon={Home}>
                  Back home
                </Button>
                <Button to="/app/research" variant="primary" leadingIcon={Sparkles}>
                  Open workspace
                </Button>
              </div>
            }
          />
        </div>
      </div>
    </div>
  );
}
