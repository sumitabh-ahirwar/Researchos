import { useState } from "react";
import { History as HistoryIcon, Plus, Trash2 } from "lucide-react";

import ReportBrowser from "../components/report/ReportBrowser.jsx";
import Button from "../components/ui/Button.jsx";
import Modal from "../components/ui/Modal.jsx";
import { EmptyState } from "../components/ui/Feedback.jsx";
import { useToast } from "../components/ui/Toast.jsx";
import { useWorkspace } from "../context/WorkspaceContext.jsx";

/**
 * Full research history.
 *
 * Clearing is destructive and unrecoverable — the entries only exist in this
 * browser — so it goes through a confirmation dialog that names the count.
 */
export default function History() {
  const { library } = useWorkspace();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const toast = useToast();

  const handleClear = () => {
    const count = library.reports.length;
    library.clearAll();
    setConfirmOpen(false);
    toast.info("History cleared", `${count} report${count === 1 ? "" : "s"} removed.`);
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2 className="page-header__title">History</h2>
          <p className="page-header__subtitle">
            Every report generated in this browser. Stored locally — clearing site data removes them.
          </p>
        </div>

        <div className="row">
          {library.reports.length > 0 && (
            <Button
              variant="danger-ghost"
              leadingIcon={Trash2}
              onClick={() => setConfirmOpen(true)}
            >
              Clear history
            </Button>
          )}
          <Button to="/app/research" variant="primary" leadingIcon={Plus}>
            New Research
          </Button>
        </div>
      </div>

      <ReportBrowser
        reports={library.reports}
        library={library}
        emptyState={
          <EmptyState
            icon={HistoryIcon}
            title="No research history yet"
            description="Reports you generate will be listed here so you can revisit them later."
            action={
              <Button to="/app/research" variant="primary" leadingIcon={Plus}>
                Start researching
              </Button>
            }
          />
        }
      />

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Clear all history?"
        description={`This permanently removes ${library.reports.length} report${
          library.reports.length === 1 ? "" : "s"
        }, including saved and pinned ones. It cannot be undone.`}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" leadingIcon={Trash2} onClick={handleClear}>
              Clear everything
            </Button>
          </>
        }
      >
        <p style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>
          Download anything you want to keep before continuing — these reports exist only in this
          browser.
        </p>
      </Modal>
    </>
  );
}
