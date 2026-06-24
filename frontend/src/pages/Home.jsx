import { useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";

import Navbar from "../components/Navbar.jsx";
import ProgressTracker from "../components/ProgressTracker.jsx";
import QueryForm from "../components/QueryForm.jsx";
import ReportViewer from "../components/ReportViewer.jsx";
import { generateResearchReport, uploadResearchPdf } from "../api/researchApi.js";

const baseSteps = [
  { id: 1, label: "Query Planner Agent", status: "pending", message: "Waiting for a topic and mode." },
  { id: 2, label: "PDF Retriever Agent", status: "pending", message: "Retrieves relevant chunks when PDF mode is active." },
  { id: 3, label: "Web Search Agent", status: "pending", message: "Runs Tavily and scraping when web research is active." },
  { id: 4, label: "Analyzer Agent", status: "pending", message: "Compares evidence and identifies gaps." },
  { id: 5, label: "Report Writer Agent", status: "pending", message: "Creates a grounded final report." },
  { id: 6, label: "Citation Checker Agent", status: "pending", message: "Checks PDF source traceability." },
  { id: 7, label: "Completed", status: "pending", message: "The final report will be ready." },
];

function Home() {
  const [topic, setTopic] = useState("");
  const [mode, setMode] = useState("web");
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentInfo, setDocumentInfo] = useState(null);
  const [submittedTopic, setSubmittedTopic] = useState("");
  const [steps, setSteps] = useState(baseSteps);
  const [report, setReport] = useState("");
  const [feedback, setFeedback] = useState("");
  const [sources, setSources] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadState, setUploadState] = useState({ isUploading: false, error: "" });

  const activeSteps = useMemo(() => {
    if (!isLoading) return steps;

    return baseSteps.map((step, index) => ({
      ...step,
      status: index === 6 ? "pending" : index === 4 ? "running" : index < 4 ? "completed" : "pending",
      message:
        index === 4
          ? "The selected multi-agent workflow is running. This can take a little while."
          : step.message,
    }));
  }, [isLoading, steps]);

  const handleModeChange = (nextMode) => {
    setMode(nextMode);
    setReport("");
    setFeedback("");
    setSources([]);
    setError("");
    setSteps(baseSteps);
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
    setDocumentInfo(null);
    setUploadState({ isUploading: false, error: "" });
  };

  const handleUploadPdf = async () => {
    if (!selectedFile) return null;

    setUploadState({ isUploading: true, error: "" });
    setError("");

    try {
      const result = await uploadResearchPdf(selectedFile);
      setDocumentInfo(result);
      return result;
    } catch (uploadError) {
      setUploadState({ isUploading: false, error: uploadError.message });
      setError(uploadError.message);
      return null;
    } finally {
      setUploadState((current) => ({ ...current, isUploading: false }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const cleanTopic = topic.trim();
    if (cleanTopic.length < 3) return;

    const needsPdf = mode === "pdf" || mode === "hybrid";
    if (needsPdf && !documentInfo) {
      setError("Upload and index a PDF before generating this report mode.");
      return;
    }

    setSubmittedTopic(cleanTopic);
    setIsLoading(true);
    setReport("");
    setFeedback("");
    setSources([]);
    setError("");
    setSteps(baseSteps);

    try {
      const result = await generateResearchReport({
        topic: cleanTopic,
        mode,
        documentId: documentInfo?.document_id || null,
      });

      setReport(result.final_report || "");
      setFeedback(result.feedback || "");
      setSources(result.sources || []);
      setSteps(result.progress || baseSteps);
    } catch (requestError) {
      setError(requestError.message);
      setSteps((currentSteps) =>
        currentSteps.map((step, index) => ({
          ...step,
          status: index < 2 ? "completed" : index === 2 ? "failed" : "pending",
        }))
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main>
      <div className="app-shell">
        <Navbar />

        <section className="hero">
          <div>
            <p className="eyebrow">Multi-agent research workspace</p>
            <h2>Generate grounded reports from web, PDFs, or both.</h2>
            <p>
              Route each query through planner, retriever, search, analyzer, writer, and citation checker agents with a clean report workflow.
            </p>
          </div>
        </section>

        <div className="workspace-grid">
          <div className="left-stack">
            <QueryForm
              topic={topic}
              setTopic={setTopic}
              mode={mode}
              setMode={handleModeChange}
              selectedFile={selectedFile}
              onFileChange={handleFileChange}
              onUploadPdf={handleUploadPdf}
              uploadState={uploadState}
              documentInfo={documentInfo}
              onSubmit={handleSubmit}
              isLoading={isLoading}
            />

            {(error || uploadState.error) && (
              <div className="error-banner">
                <AlertTriangle size={18} aria-hidden="true" />
                <span>{error || uploadState.error}</span>
              </div>
            )}

            <ProgressTracker steps={activeSteps} />
          </div>

          <ReportViewer
            report={report}
            feedback={feedback}
            topic={submittedTopic || topic}
            mode={mode}
            sources={sources}
            documentInfo={documentInfo}
          />
        </div>
      </div>
    </main>
  );
}

export default Home;
