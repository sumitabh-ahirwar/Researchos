import { FileText, Globe2, Layers3, Loader2, Sparkles, UploadCloud } from "lucide-react";

const modes = [
  {
    id: "web",
    label: "Web Research",
    icon: Globe2,
  },
  {
    id: "pdf",
    label: "PDF RAG",
    icon: FileText,
  },
  {
    id: "hybrid",
    label: "Hybrid",
    icon: Layers3,
  },
];

function QueryForm({
  topic,
  setTopic,
  mode,
  setMode,
  selectedFile,
  onFileChange,
  onUploadPdf,
  uploadState,
  documentInfo,
  onSubmit,
  isLoading,
}) {
  const needsPdf = mode === "pdf" || mode === "hybrid";
  const uploadLabel = uploadState.isUploading ? "Indexing PDF" : documentInfo ? "PDF Indexed" : "Upload PDF";

  return (
    <form className="query-card" onSubmit={onSubmit}>
      <div className="section-heading">
        <p>Research brief</p>
        <h2>Choose a mode and topic</h2>
      </div>

      <div className="mode-selector" role="tablist" aria-label="Research mode">
        {modes.map((item) => {
          const Icon = item.icon;
          const isActive = mode === item.id;

          return (
            <button
              type="button"
              className={isActive ? "active" : ""}
              key={item.id}
              onClick={() => setMode(item.id)}
              aria-pressed={isActive}
            >
              <Icon size={16} aria-hidden="true" />
              {item.label}
            </button>
          );
        })}
      </div>

      {needsPdf && (
        <div className="upload-panel">
          <label htmlFor="pdf-upload">
            <UploadCloud size={18} aria-hidden="true" />
            <span>{selectedFile?.name || documentInfo?.filename || "Select a PDF document"}</span>
          </label>
          <input
            id="pdf-upload"
            type="file"
            accept="application/pdf,.pdf"
            onChange={onFileChange}
            disabled={isLoading || uploadState.isUploading}
          />
          <button
            type="button"
            onClick={onUploadPdf}
            disabled={!selectedFile || uploadState.isUploading || isLoading}
          >
            {uploadState.isUploading && <Loader2 className="spin" size={17} aria-hidden="true" />}
            {uploadLabel}
          </button>
          {documentInfo && (
            <p>
              {documentInfo.pages} pages indexed into {documentInfo.chunks} chunks.
            </p>
          )}
        </div>
      )}

      <textarea
        value={topic}
        onChange={(event) => setTopic(event.target.value)}
        placeholder="Example: Analyze the impact of agentic AI systems on enterprise knowledge work"
        rows={7}
        disabled={isLoading}
      />

      <div className="query-actions">
        <span>{topic.length}/500 characters</span>
        <button
          type="submit"
          disabled={isLoading || uploadState.isUploading || topic.trim().length < 3 || (needsPdf && !documentInfo)}
        >
          {isLoading ? (
            <>
              <Loader2 className="spin" size={18} aria-hidden="true" />
              Generating
            </>
          ) : (
            <>
              <Sparkles size={18} aria-hidden="true" />
              Generate Report
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export default QueryForm;
