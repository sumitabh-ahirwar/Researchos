import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { generateResearchReport, uploadResearchPdf } from "../api/researchApi.js";
import { BASE_PROGRESS_STEPS } from "../constants/agents.js";
import { MIN_TOPIC_LENGTH, modeRequiresDocument } from "../constants/modes.js";

/**
 * Owns the entire research workspace session.
 *
 * This is a straight extraction of the state machine that previously lived in
 * pages/Home.jsx. The request contract is unchanged: `uploadResearchPdf` is
 * still called with one File at a time, and `generateResearchReport` still
 * receives `{ topic, mode, documentId }` where `documentId` is the id returned
 * by a successful upload (or null). Nothing about the pipeline, the payloads,
 * or the response handling was altered — only the surrounding bookkeeping that
 * lets the UI show several documents and a live elapsed timer.
 */

let localId = 0;
const nextLocalId = () => {
  localId += 1;
  return `doc-${localId}-${Date.now()}`;
};

export default function useResearchSession({ onComplete } = {}) {
  const [topic, setTopic] = useState("");
  const [mode, setMode] = useState("web");

  // One entry per file the user added. `status` tracks that file's own upload
  // lifecycle so a failure on one document does not blank out the others.
  const [documents, setDocuments] = useState([]);
  const [activeDocumentId, setActiveDocumentId] = useState(null);

  const [submittedTopic, setSubmittedTopic] = useState("");
  const [steps, setSteps] = useState(BASE_PROGRESS_STEPS);
  const [report, setReport] = useState("");
  const [feedback, setFeedback] = useState("");
  const [sources, setSources] = useState([]);
  const [metadata, setMetadata] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  /** The document that will ground the next request. */
  const activeDocument = useMemo(
    () => documents.find((doc) => doc.localId === activeDocumentId && doc.status === "ready") ?? null,
    [documents, activeDocumentId],
  );

  const readyDocuments = useMemo(
    () => documents.filter((doc) => doc.status === "ready"),
    [documents],
  );

  const isUploading = documents.some((doc) => doc.status === "uploading");
  const needsDocument = modeRequiresDocument(mode);
  const canGenerate =
    !isLoading &&
    !isUploading &&
    topic.trim().length >= MIN_TOPIC_LENGTH &&
    (!needsDocument || Boolean(activeDocument));

  /* ---------------------------------------------------------------------
     Elapsed timer — real wall-clock feedback while the blocking request runs.
     --------------------------------------------------------------------- */
  useEffect(() => {
    if (!isLoading) return undefined;

    const startedAt = Date.now();
    setElapsed(0);
    const interval = setInterval(() => {
      setElapsed((Date.now() - startedAt) / 1000);
    }, 250);

    return () => clearInterval(interval);
  }, [isLoading]);

  /* ---------------------------------------------------------------------
     Mode switching — clears the previous result exactly as before.
     --------------------------------------------------------------------- */
  const changeMode = useCallback((nextMode) => {
    setMode(nextMode);
    setReport("");
    setFeedback("");
    setSources([]);
    setMetadata(null);
    setError("");
    setSteps(BASE_PROGRESS_STEPS);
  }, []);

  /* ---------------------------------------------------------------------
     Uploads. Each file is a separate POST /api/research/upload-pdf call,
     matching the endpoint's single-file contract. They run in sequence so a
     batch of documents cannot flood the ingestion pipeline at once.
     --------------------------------------------------------------------- */
  const uploadFiles = useCallback(async (fileList) => {
    const files = Array.from(fileList ?? []).filter((file) =>
      file.name.toLowerCase().endsWith(".pdf"),
    );
    if (files.length === 0) return;

    setError("");

    const queued = files.map((file) => ({
      localId: nextLocalId(),
      name: file.name,
      size: file.size,
      status: "uploading",
      error: "",
      document_id: null,
      filename: null,
      pages: 0,
      chunks: 0,
      file,
    }));

    setDocuments((current) => [...current, ...queued]);

    for (const entry of queued) {
      try {
        const result = await uploadResearchPdf(entry.file);

        setDocuments((current) =>
          current.map((doc) =>
            doc.localId === entry.localId
              ? {
                  ...doc,
                  status: "ready",
                  document_id: result.document_id,
                  filename: result.filename,
                  pages: result.pages,
                  chunks: result.chunks,
                  message: result.message,
                  file: undefined,
                }
              : doc,
          ),
        );

        // First document to land becomes the active one; later uploads only
        // take over if nothing is selected, so an explicit choice sticks.
        setActiveDocumentId((current) => current ?? entry.localId);
      } catch (uploadError) {
        setDocuments((current) =>
          current.map((doc) =>
            doc.localId === entry.localId
              ? { ...doc, status: "failed", error: uploadError.message, file: undefined }
              : doc,
          ),
        );
        setError(uploadError.message);
      }
    }
  }, []);

  const removeDocument = useCallback((localIdToRemove) => {
    setDocuments((current) => current.filter((doc) => doc.localId !== localIdToRemove));
    setActiveDocumentId((current) => (current === localIdToRemove ? null : current));
  }, []);

  const retryDocument = useCallback(
    (localIdToRetry) => {
      const target = documents.find((doc) => doc.localId === localIdToRetry);
      if (!target?.file) return;
      removeDocument(localIdToRetry);
      uploadFiles([target.file]);
    },
    [documents, removeDocument, uploadFiles],
  );

  /* ---------------------------------------------------------------------
     Generate. Identical request/response handling to the original page.
     --------------------------------------------------------------------- */
  const generate = useCallback(async () => {
    const cleanTopic = topic.trim();
    if (cleanTopic.length < MIN_TOPIC_LENGTH) return;

    if (modeRequiresDocument(mode) && !activeDocument) {
      setError("Upload and index a PDF before generating this report mode.");
      return;
    }

    setSubmittedTopic(cleanTopic);
    setIsLoading(true);
    setReport("");
    setFeedback("");
    setSources([]);
    setMetadata(null);
    setError("");
    setSteps(BASE_PROGRESS_STEPS);

    try {
      const result = await generateResearchReport({
        topic: cleanTopic,
        mode,
        documentId: activeDocument?.document_id || null,
      });

      setReport(result.final_report || "");
      setFeedback(result.feedback || "");
      setSources(result.sources || []);
      setMetadata(result.metadata || null);
      setSteps(result.progress || BASE_PROGRESS_STEPS);

      onCompleteRef.current?.({
        topic: cleanTopic,
        mode,
        report: result.final_report || "",
        feedback: result.feedback || "",
        sources: result.sources || [],
        metadata: result.metadata || null,
        documentName: activeDocument?.filename ?? null,
      });
    } catch (requestError) {
      setError(requestError.message);
      setSteps((currentSteps) =>
        currentSteps.map((step, index) => ({
          ...step,
          status: index < 2 ? "completed" : index === 2 ? "failed" : "pending",
        })),
      );
    } finally {
      setIsLoading(false);
    }
  }, [topic, mode, activeDocument]);

  const handleSubmit = useCallback(
    (event) => {
      event?.preventDefault?.();
      generate();
    },
    [generate],
  );

  const reset = useCallback(() => {
    setTopic("");
    setReport("");
    setFeedback("");
    setSources([]);
    setMetadata(null);
    setError("");
    setSubmittedTopic("");
    setSteps(BASE_PROGRESS_STEPS);
  }, []);

  return {
    // query
    topic,
    setTopic,
    mode,
    setMode: changeMode,
    submittedTopic,

    // documents
    documents,
    readyDocuments,
    activeDocument,
    activeDocumentId,
    setActiveDocumentId,
    uploadFiles,
    removeDocument,
    retryDocument,
    isUploading,
    needsDocument,

    // run
    steps,
    report,
    feedback,
    sources,
    metadata,
    error,
    setError,
    isLoading,
    elapsed,
    canGenerate,
    handleSubmit,
    generate,
    reset,
  };
}
