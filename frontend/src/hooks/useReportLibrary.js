import { useCallback, useMemo } from "react";

import useLocalStorage from "./useLocalStorage.js";
import { countWords, readingTime } from "../utils/format.js";

const STORAGE_KEY = "researchos:reports";
const MAX_ENTRIES = 60;

/**
 * Client-side report library.
 *
 * The backend has no persistence endpoint, so history, saved, and pinned
 * reports live in localStorage. That is a real constraint, not a mock: entries
 * survive reloads but are per-browser and disappear with site data. The Help
 * page and the FAQ both state this so nobody assumes server-side sync.
 */
export default function useReportLibrary() {
  const [reports, setReports] = useLocalStorage(STORAGE_KEY, []);

  const addReport = useCallback(
    ({ topic, mode, report, feedback, sources, metadata, documentName }) => {
      if (!report) return null;

      const entry = {
        id: `r-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        topic,
        mode,
        report,
        feedback: feedback || "",
        sources: sources || [],
        metadata: metadata || null,
        documentName: documentName || null,
        createdAt: new Date().toISOString(),
        saved: false,
        pinned: false,
        words: countWords(report),
        minutes: readingTime(report),
      };

      setReports((current) => [entry, ...current].slice(0, MAX_ENTRIES));
      return entry;
    },
    [setReports],
  );

  const updateReport = useCallback(
    (id, patch) => {
      setReports((current) =>
        current.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)),
      );
    },
    [setReports],
  );

  const toggleSaved = useCallback(
    (id) =>
      setReports((current) =>
        current.map((entry) => (entry.id === id ? { ...entry, saved: !entry.saved } : entry)),
      ),
    [setReports],
  );

  const togglePinned = useCallback(
    (id) =>
      setReports((current) =>
        current.map((entry) => (entry.id === id ? { ...entry, pinned: !entry.pinned } : entry)),
      ),
    [setReports],
  );

  const removeReport = useCallback(
    (id) => setReports((current) => current.filter((entry) => entry.id !== id)),
    [setReports],
  );

  const clearAll = useCallback(() => setReports([]), [setReports]);

  const getReport = useCallback((id) => reports.find((entry) => entry.id === id) ?? null, [reports]);

  const derived = useMemo(() => {
    const saved = reports.filter((entry) => entry.saved);
    const pinned = reports.filter((entry) => entry.pinned);

    return {
      saved,
      pinned,
      recent: reports.slice(0, 5),
      stats: {
        total: reports.length,
        saved: saved.length,
        pinned: pinned.length,
        words: reports.reduce((sum, entry) => sum + (entry.words || 0), 0),
        byMode: reports.reduce((acc, entry) => {
          acc[entry.mode] = (acc[entry.mode] || 0) + 1;
          return acc;
        }, {}),
      },
    };
  }, [reports]);

  return {
    reports,
    ...derived,
    addReport,
    updateReport,
    toggleSaved,
    togglePinned,
    removeReport,
    clearAll,
    getReport,
  };
}
