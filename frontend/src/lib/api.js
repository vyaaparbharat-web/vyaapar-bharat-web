// One place for every call to the backend.
// - adds the logged-in user's token automatically
// - throws an Error with the server's message, so pages can show it
// - on an expired/invalid session, logs the user out everywhere
const BASE = import.meta.env.VITE_API_URL || "";

export const TOKEN_KEY = "vyapaar_token";
export const USER_KEY = "vyapaar_user";

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export async function api(path, { method = "GET", body, headers = {}, signal } = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;

  let response;
  try {
    response = await fetch(`${BASE}${path}`, {
      method,
      signal,
      headers: {
        ...(body && !isForm ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new ApiError("Can't reach the server. Check your connection and try again.", 0);
  }

  let data = {};
  try {
    data = await response.json();
  } catch {
    /* empty or non-JSON body */
  }

  if (!response.ok || data.success === false) {
    if (response.status === 401 && token) {
      window.dispatchEvent(new CustomEvent("vyapaar:session-expired"));
    }
    throw new ApiError(data.message || `Request failed (${response.status})`, response.status, data);
  }
  return data;
}

// For <img src>: uploaded files live on the API server
export function assetUrl(path) {
  if (!path) return null;
  if (/^(https?:|data:|blob:)/.test(path)) return path;
  return `${BASE}${path.startsWith("/") ? "" : "/"}${path}`;
}
