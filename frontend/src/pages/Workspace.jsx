import { useCallback } from "react";
import { CheckCircle2, RotateCcw } from "lucide-react";

import QueryComposer from "../components/workspace/QueryComposer.jsx";
import PdfDropzone from "../components/workspace/PdfDropzone.jsx";
import AgentPipeline from "../components/workspace/AgentPipeline.jsx";
import SourceMerge from "../components/workspace/SourceMerge.jsx";
import ReportViewer from "../components/report/ReportViewer.jsx";
import { Alert } from "../components/ui/Feedback.jsx";
import Button from "../components/ui/Button.jsx";
import { useToast } from "../components/ui/Toast.jsx";
import useResearchSession from "../hooks/useResearchSession.js";
import useEstimatedProgress from "../hooks/useEstimatedProgress.js";
import { useWorkspace } from "../context/WorkspaceContext.jsx";

/**
 * Research workspace — the one page that talks to the pipeline.
 *
 * All request behaviour lives in `useResearchSession`, which is a direct
 * extraction of the original page's state machine; this component only decides
 * how that state is laid out. The composer and pipeline sit side by side on
 * wide screens so a running job stays visible while you read the brief, and
 * the report takes the full width below once it lands.
 */
export default function Workspace() {
  const toast = useToast();
  const { library, pushNotification } = useWorkspace();

  const handleComplete = useCallback(
    (result) => {
      const entry = library.addReport(result);

      toast.success("Report ready", `${result.topic.slice(0, 60)}…`);
      pushNotification({
        kind: "success",
        title: `Report generated: ${result.topic}`,
        icon: CheckCircle2,
        reportId: entry?.id,
      });
    },
    [library, toast, pushNotification],
  );

  const session = useResearchSession({ onComplete: handleComplete });

  const displaySteps = useEstimatedProgress({
    isLoading: session.isLoading,
    mode: session.mode,
    serverSteps: session.steps,
  });

  const showDropzone = session.needsDocument;

  return (
    <div className="stack" style={{ gap: "var(--space-6)" }}>
      <div className="workspace">
        <div className="workspace__main">
          <QueryComposer
            topic={session.topic}
            onTopicChange={session.setTopic}
            mode={session.mode}
            onModeChange={session.setMode}
            onSubmit={session.handleSubmit}
            isLoading={session.isLoading}
            canGenerate={session.canGenerate}
            needsDocument={session.needsDocument}
            hasDocument={Boolean(session.activeDocument)}
          >
            {showDropzone && (
              <PdfDropzone
                documents={session.documents}
                activeDocumentId={session.activeDocumentId}
                onSelectActive={session.setActiveDocumentId}
                onUpload={session.uploadFiles}
                onRemove={session.removeDocument}
                onRetry={session.retryDocument}
                disabled={session.isLoading}
              />
            )}
          </QueryComposer>

          {session.error && (
            <Alert
              variant="danger"
              title="The request did not complete"
              action={
                <Button
                  variant="ghost"
                  size="xs"
                  leadingIcon={RotateCcw}
                  onClick={session.generate}
                  disabled={!session.canGenerate}
                >
                  Retry
                </Button>
              }
            >
              {session.error}
            </Alert>
          )}
        </div>

        <aside className="workspace__aside">
          <div className="card" style={{ padding: "var(--space-5)" }}>
            <AgentPipeline
              steps={displaySteps}
              isLoading={session.isLoading}
              elapsed={session.elapsed}
              mode={session.mode}
            />
          </div>

          <div className="card" style={{ padding: "var(--space-5)" }}>
            <SourceMerge
              mode={session.mode}
              activeDocument={session.activeDocument}
              sourceCount={session.sources.length}
            />
          </div>
        </aside>
      </div>

      <ReportViewer
        report={session.report}
        feedback={session.feedback}
        topic={session.submittedTopic || session.topic}
        mode={session.mode}
        sources={session.sources}
        metadata={session.metadata}
        isLoading={session.isLoading}
        emptyDescription={
          session.needsDocument && !session.activeDocument
            ? "Upload a PDF above and mark it active, then describe what you want researched."
            : undefined
        }
        onNotify={(variant, title, message) => toast[variant]?.(title, message)}
      />
    </div>
  );
}
