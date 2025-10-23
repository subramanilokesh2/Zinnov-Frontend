// src/api.js
const API_BASE =
  (typeof import.meta !== "undefined" && import.meta?.env?.VITE_API_BASE) ||
  process.env.REACT_APP_API_BASE ||
  "http://localhost:5000"; // local fallback

export async function jsonFetch(path, opts = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const isForm = opts?.body instanceof FormData;

  const headers = new Headers(opts.headers || {});
  // Only set JSON header when NOT sending FormData
  if (!isForm && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const init = {
    credentials: "include",
    ...opts,
    headers,
  };

  // If body is a plain object and not FormData, stringify it
  if (!isForm && init.body && typeof init.body === "object") {
    init.body = JSON.stringify(init.body);
  }

  return fetch(url, init);
}
