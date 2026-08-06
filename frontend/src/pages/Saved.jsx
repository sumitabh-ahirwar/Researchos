import { Bookmark, Plus } from "lucide-react";

import ReportBrowser from "../components/report/ReportBrowser.jsx";
import Button from "../components/ui/Button.jsx";
import { EmptyState } from "../components/ui/Feedback.jsx";
import { useWorkspace } from "../context/WorkspaceContext.jsx";

/** Reports the user explicitly marked to keep. */
export default function Saved() {
  const { library } = useWorkspace();

  return (
    <>
      <div className="page-header">
        <div>
          <h2 className="page-header__title">Saved Reports</h2>
          <p className="page-header__subtitle">
            Reports you marked to keep. Pinned ones also appear on your dashboard.
          </p>
        </div>
        <Button to="/app/research" variant="primary" leadingIcon={Plus}>
          New Research
        </Button>
      </div>

      <ReportBrowser
        reports={library.saved}
        library={library}
        emptyState={
          <EmptyState
            icon={Bookmark}
            title="Nothing saved yet"
            description="Open any report and hit Save to keep it here, or pin it to surface it on your dashboard."
            action={
              <Button to="/app/history" variant="secondary">
                Browse history
              </Button>
            }
          />
        }
      />
    </>
  );
}
