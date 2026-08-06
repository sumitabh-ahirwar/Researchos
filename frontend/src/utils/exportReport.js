import { slugify } from "./format.js";

/**
 * Export helpers for a generated report.
 *
 * `downloadMarkdown` writes the raw Markdown the API returned — no rewriting,
 * so the file matches the source exactly. `printReport` opens the browser's
 * print dialog, which is how the user saves a PDF; there is no PDF renderer in
 * the bundle and adding one would ship ~500 KB for a job the browser already
 * does well.
 */

export function buildFilename(topic, extension) {
  return `${slugify(topic) || "research-report"}.${extension}`;
}

export function downloadMarkdown(report, topic) {
  if (!report) return;

  const blob = new Blob([report], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = buildFilename(topic, "md");
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  // Revoke on the next tick so Firefox has finished reading the blob.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export async function copyToClipboard(text) {
  if (!text) return false;

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Clipboard API needs a secure context; fall back to a hidden textarea.
    try {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      area.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

/**
 * Trigger the print dialog. The print stylesheet in styles/report.css hides
 * app chrome so the output is just the report body.
 */
export function printReport() {
  window.print();
}
