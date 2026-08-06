import { Component } from "react";
import { AlertOctagon, RotateCcw } from "lucide-react";

/**
 * Top-level error boundary.
 *
 * Without one, a render error anywhere unmounts the whole tree and leaves a
 * blank page — the single worst failure mode for a long-running research
 * session. This keeps the shell alive, shows what happened, and offers a
 * reload. Class component because error boundaries have no hook equivalent.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // No telemetry pipeline in this build; the console is the sink.
    console.error("Unhandled UI error:", error, info?.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 32 }}>
        <div className="card" style={{ maxWidth: 520, padding: "var(--space-8)" }}>
          <span className="icon-tile icon-tile--lg icon-tile--danger" aria-hidden="true">
            <AlertOctagon size={24} />
          </span>

          <h1 style={{ marginTop: "var(--space-5)", fontSize: "var(--text-xl)" }}>
            Something broke in the interface
          </h1>

          <p
            style={{
              marginTop: "var(--space-3)",
              color: "var(--text-secondary)",
              fontSize: "var(--text-sm)",
              lineHeight: "var(--leading-normal)",
            }}
          >
            This is a rendering failure, not a problem with your research. Any reports already
            saved in this browser are untouched.
          </p>

          <pre
            style={{
              marginTop: "var(--space-5)",
              padding: "var(--space-4)",
              borderRadius: "var(--radius-sm)",
              background: "var(--bg-muted)",
              color: "var(--text-tertiary)",
              fontSize: "var(--text-xs)",
              fontFamily: "var(--font-mono)",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              maxHeight: 160,
              overflow: "auto",
            }}
          >
            {String(error?.message ?? error)}
          </pre>

          <button
            type="button"
            className="btn btn--primary btn--md"
            style={{ marginTop: "var(--space-6)" }}
            onClick={() => window.location.reload()}
          >
            <RotateCcw size={16} aria-hidden="true" />
            Reload the app
          </button>
        </div>
      </div>
    );
  }
}
