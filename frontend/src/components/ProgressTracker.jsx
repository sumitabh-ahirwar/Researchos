import { Check, Clock, Loader2, X } from "lucide-react";

const iconMap = {
  pending: Clock,
  running: Loader2,
  completed: Check,
  failed: X,
};

function ProgressTracker({ steps }) {
  return (
    <section className="panel progress-panel">
      <div className="section-heading">
        <p>Agent workflow</p>
        <h2>Progress</h2>
      </div>

      <div className="timeline">
        {steps.map((step) => {
          const Icon = iconMap[step.status] || Clock;

          return (
            <div className={`timeline-step ${step.status}`} key={step.id}>
              <div className="timeline-icon">
                <Icon
                  className={step.status === "running" ? "spin" : ""}
                  size={16}
                  aria-hidden="true"
                />
              </div>
              <div>
                <div className="timeline-title">
                  <strong>{step.label}</strong>
                  <span>{step.status}</span>
                </div>
                {step.message && <p>{step.message}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default ProgressTracker;
