import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileQuestion, Pin, PinOff, Trash2 } from "lucide-react";

import ReportViewer from "../components/report/ReportViewer.jsx";
import Button from "../components/ui/Button.jsx";
import Tooltip from "../components/ui/Tooltip.jsx";
import { EmptyState } from "../components/ui/Feedback.jsx";
import { useToast } from "../components/ui/Toast.jsx";
import { useWorkspace } from "../context/WorkspaceContext.jsx";

/** Reader view for a stored report. */
export default function ReportPage() {
  const { reportId } = useParams();
  const { library } = useWorkspace();
  const navigate = useNavigate();
  const toast = useToast();

  const report = library.getReport(reportId);

  if (!report) {
    return (
      <div className="card">
        <EmptyState
          icon={FileQuestion}
          title="Report not found"
          description="This report is no longer in your library. It may have been deleted, or generated in a different browser."
          action={
            <Button to="/app/history" variant="primary" leadingIcon={ArrowLeft}>
              Back to history
            </Button>
          }
        />
      </div>
    );
  }

  const handleDelete = () => {
    library.removeReport(report.id);
    toast.info("Report deleted");
    navigate("/app/history");
  };

  return (
    <>
      <div className="row" style={{ marginBottom: "var(--space-6)" }}>
        <Link
          to="/app/history"
          className="btn btn--ghost btn--sm"
          style={{ marginLeft: "calc(var(--space-4) * -1)" }}
        >
          <ArrowLeft size={16} aria-hidden="true" />
          History
        </Link>

        <span className="spacer" />

        <Tooltip label={report.pinned ? "Unpin from dashboard" : "Pin to dashboard"}>
          <Button
            variant={report.pinned ? "soft" : "ghost"}
            size="sm"
            leadingIcon={report.pinned ? PinOff : Pin}
            onClick={() => library.togglePinned(report.id)}
          >
            {report.pinned ? "Pinned" : "Pin"}
          </Button>
        </Tooltip>

        <Tooltip label="Delete report">
          <Button
            variant="danger-ghost"
            size="sm"
            iconOnly
            leadingIcon={Trash2}
            onClick={handleDelete}
            aria-label="Delete report"
          />
        </Tooltip>
      </div>

      <ReportViewer
        report={report.report}
        feedback={report.feedback}
        topic={report.topic}
        mode={report.mode}
        sources={report.sources}
        metadata={report.metadata}
        createdAt={report.createdAt}
        saved={report.saved}
        onToggleSaved={() => library.toggleSaved(report.id)}
        onNotify={(variant, title, message) => toast[variant]?.(title, message)}
      />
    </>
  );
}
