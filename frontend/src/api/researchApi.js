const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

async function readJsonResponse(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function getErrorMessage(data, fallback) {
  return data?.detail?.[0]?.msg || data?.detail || data?.error || fallback;
}

export async function uploadResearchPdf(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/api/research/upload-pdf`, {
    method: "POST",
    body: formData,
  });

  const data = await readJsonResponse(response);

  if (!response.ok || !data?.success) {
    throw new Error(getErrorMessage(data, "The PDF upload failed."));
  }

  return data;
}

export async function generateResearchReport({ topic, mode = "web", documentId = null }) {
  const response = await fetch(`${API_BASE_URL}/api/research/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      topic,
      mode,
      document_id: documentId,
    }),
  });

  const data = await readJsonResponse(response);

  if (!response.ok || !data?.success) {
    throw new Error(getErrorMessage(data, "The research request failed."));
  }

  return data;
}
