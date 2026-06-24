import { Clipboard, Download, FileText } from "lucide-react";
// 1. Import the markdown renderer
import Markdown from "react-markdown";

function ReportViewer({ report, feedback, topic, mode, sources = [], documentInfo }) {
  const hasReport = Boolean(report);

  const copyReport = async () => {
    if (!hasReport) return;
    await navigator.clipboard.writeText(report);
  };

  const downloadReport = () => {
    if (!hasReport) return;

    const safeTopic = topic
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 60);

    const blob = new Blob([report], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${safeTopic || "research-report"}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="panel report-panel">
      <div className="report-header">
        <div className="section-heading">
          <p>{mode === "web" ? "Web research output" : mode === "pdf" ? "PDF RAG output" : "Hybrid output"}</p>
          <h2>Research report</h2>
        </div>

        <div className="report-actions">
          <button type="button" onClick={copyReport} disabled={!hasReport} title="Copy report">
            <Clipboard size={17} aria-hidden="true" />
            Copy
          </button>
          <button type="button" onClick={downloadReport} disabled={!hasReport} title="Download report">
            <Download size={17} aria-hidden="true" />
            Download
          </button>
        </div>
      </div>

      {hasReport ? (
        <>
          {/* 2. Replaced line split mapping with <Markdown /> */}
          <article className="report-body prose">
            <Markdown>{report}</Markdown>
          </article>

          {sources.length > 0 && (
            <div className="sources-box">
              <div>
                <FileText size={18} aria-hidden="true" />
                <strong>Retrieved PDF sources</strong>
              </div>
              <div className="source-list">
                {sources.map((source) => (
                  <article key={`${source.source_number}-${source.page}`} className="source-item">
                    <strong>
                      Source {source.source_number}: {source.filename}
                    </strong>
                    <span>Page {source.page}</span>
                    <p>{source.preview}</p>
                  </article>
                ))}
              </div>
            </div>
          )}

          {feedback && (
            <div className="feedback-box">
              <div>
                <FileText size={18} aria-hidden="true" />
                <strong>Critic feedback</strong>
              </div>
              <Markdown>{feedback}</Markdown>
            </div>
          )}
        </>
      ) : (
        <div className="empty-state">
          <FileText size={34} aria-hidden="true" />
          <h3>Your generated report will appear here</h3>
          <p>
            {documentInfo
              ? `${documentInfo.filename} is indexed and ready for PDF-aware reporting.`
              : "Submit a research topic and the final report will be displayed in this reading pane."}
          </p>
        </div>
      )}
    </section>
  );
}

export default ReportViewer;
