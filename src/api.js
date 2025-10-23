// src/api.js
const API_BASE =
  (typeof import.meta !== "undefined" && import.meta?.env?.VITE_API_BASE) ||
  process.env.REACT_APP_API_BASE ||
  "https://zinnov-backend.onrender.com";

function buildHeaders(body) {
  const h = {};
  // IMPORTANT: do not set Content-Type for FormData (browser sets boundary)
  if (!(body instanceof FormData)) h["Content-Type"] = "application/json";
  const token = localStorage.getItem("authToken");
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

export async function apiFetch(path, { method = "GET", body, headers = {}, ...rest } = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const finalHeaders = { ...buildHeaders(body), ...headers };
  const res = await fetch(url, { method, body, headers: finalHeaders, credentials: "include", ...rest });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { msg = (await res.text()) || msg; } catch {}
    throw new Error(msg);
  }
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : res.text();
}
