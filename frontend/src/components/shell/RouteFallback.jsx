import { Skeleton, SkeletonText } from "../ui/Feedback.jsx";

/**
 * Suspense fallback for lazily loaded routes.
 *
 * Shaped roughly like a page — a heading, a couple of cards — rather than a
 * centred spinner, so the transition into real content does not reflow the
 * whole viewport. Announced politely so screen readers know something is
 * loading without the message interrupting.
 */
export default function RouteFallback() {
  return (
    <div
      style={{ padding: "var(--space-10) var(--space-6)", maxWidth: 1100, margin: "0 auto" }}
      role="status"
      aria-live="polite"
      aria-label="Loading page"
    >
      <Skeleton height={30} width="34%" />
      <div style={{ marginTop: "var(--space-3)" }}>
        <Skeleton variant="text" height={12} width="52%" />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "var(--space-4)",
          marginTop: "var(--space-10)",
        }}
      >
        {[0, 1, 2].map((index) => (
          <div className="card" style={{ padding: "var(--space-6)" }} key={index}>
            <Skeleton height={38} width={38} variant="circle" />
            <div style={{ marginTop: "var(--space-5)" }}>
              <SkeletonText lines={3} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
