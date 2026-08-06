const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

/**
 * Auth API client.
 *
 * Every call sends `credentials: "include"` because the session lives in an
 * httpOnly cookie the browser attaches automatically — there is no token for
 * JavaScript to hold, which is the point. Note that the cookie is bound to the
 * API's host: open the frontend on the same host as VITE_API_BASE_URL
 * (127.0.0.1, not localhost) or the browser will not send it back.
 */

async function readJsonResponse(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * FastAPI reports validation failures as `detail: [{loc, msg}]` and business
 * errors as `detail: "..."`. Flatten both into one readable string.
 */
function getErrorMessage(data, fallback) {
  const detail = data?.detail;

  if (Array.isArray(detail)) {
    const first = detail[0];
    if (first?.msg) {
      const field = first.loc?.[first.loc.length - 1];
      return field && field !== "body" ? `${field}: ${first.msg}` : first.msg;
    }
  }

  if (typeof detail === "string") return detail;
  return data?.error || fallback;
}

async function request(path, { method = "GET", body } = {}) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      credentials: "include",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    // fetch only rejects on network-level failure, which here almost always
    // means the API is not running.
    throw new Error("Could not reach the server. Is the backend running?");
  }

  const data = await readJsonResponse(response);

  if (!response.ok) {
    const error = new Error(getErrorMessage(data, "The request failed."));
    error.status = response.status;
    throw error;
  }

  return data;
}

export function signup({ name, email, password }) {
  return request("/api/auth/signup", { method: "POST", body: { name, email, password } });
}

export function login({ email, password }) {
  return request("/api/auth/login", { method: "POST", body: { email, password } });
}

export function logout() {
  return request("/api/auth/logout", { method: "POST" });
}

/**
 * Resolve the current session. Returns null when signed out rather than
 * throwing, because "no session" is the expected state on a cold load.
 */
export async function fetchCurrentUser() {
  try {
    return await request("/api/auth/me");
  } catch (error) {
    if (error.status === 401) return null;
    throw error;
  }
}
