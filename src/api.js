// src/api.js
const API_BASE =
  (typeof import.meta !== "undefined" && import.meta?.env?.VITE_API_BASE) ||
  process.env.REACT_APP_API_BASE ||
  "https://zinnov-backend.onrender.com";

function buildHeaders(body) {
  const h = {};
  // Do NOT set Content-Type for FormData—browser sets boundary automatically
  if (!(body instanceof FormData)) h["Content-Type"] = "application/json";
  const token = localStorage.getItem("authToken");
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

export async function apiFetch(
  path,
  { method = "GET", body, headers = {}, timeoutMs = 30000, ...rest } = {}
) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const finalHeaders = { ...buildHeaders(body), ...headers };

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(new DOMException("timeout", "AbortError")), timeoutMs);

  let res;
  try {
    res = await fetch(url, {
      method,
      body,
      headers: finalHeaders,
      credentials: "include",
      signal: ctrl.signal,
      ...rest,
    });
  } finally {
    clearTimeout(t);
  }

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { msg = (await res.text()) || msg; } catch {}
    throw new Error(msg);
  }

  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    try { return await res.json(); } catch { return {}; }
  }
  return res.text();
}
