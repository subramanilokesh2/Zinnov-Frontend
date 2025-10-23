// src/api.js
// Centralized API helper for all fetch calls

const API_BASE =
  (typeof import.meta !== "undefined" && import.meta?.env?.VITE_API_BASE) ||
  process.env.REACT_APP_API_BASE ||
  "https://zinnov-backend.onrender.com"; // fallback

function buildHeaders(body) {
  const headers = {};
  // IMPORTANT: do not set Content-Type for FormData (browser will set boundary)
  if (!(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  const token = localStorage.getItem("authToken") || localStorage.getItem("token");
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

/**
 * Universal API helper
 * - Handles both JSON and FormData bodies
 * - Throws clear errors on non-2xx responses
 * - Returns parsed JSON or text
 */
export async function apiFetch(path, { method = "GET", body, headers = {}, ...rest } = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const finalHeaders = { ...buildHeaders(body), ...headers };

  const res = await fetch(url, { method, body, headers: finalHeaders, credentials: "include", ...rest });

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const text = await res.text();
      message = text || message;
    } catch {}
    throw new Error(message);
  }

  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return res.text();
}
