// src/api.js
const API_BASE = "https://zinnov-backend.onrender.com";

export async function jsonFetch(endpoint, opts = {}) {
  let { body, headers, method, ...rest } = opts;

  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint}`;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  if (!method && body && !isFormData) method = "POST";
  if (!method) method = "GET";

  const finalHeaders = new Headers(headers || {});
  if (!isFormData && body && !finalHeaders.has("Content-Type")) {
    finalHeaders.set("Content-Type", "application/json");
  }
  if (!finalHeaders.has("Accept")) {
    finalHeaders.set("Accept", "application/json");
  }

  const looksLikeJsonString =
    typeof body === "string" && (body.trim().startsWith("{") || body.trim().startsWith("["));

  const fetchBody =
    method.toUpperCase() === "GET"
      ? undefined
      : isFormData
      ? body
      : body
      ? looksLikeJsonString
        ? body
        : JSON.stringify(body)
      : undefined;

  const res = await fetch(url, {
    method,
    credentials: "include",
    headers: finalHeaders,
    body: fetchBody,
    ...rest,
  });

  const text = await res.text();
  let parsed = null;
  try { parsed = text ? JSON.parse(text) : null; } catch {}

  if (!res.ok) {
    const detail = parsed || text || res.statusText;
    const message =
      typeof detail === "string"
        ? `HTTP ${res.status}: ${detail.slice(0, 500)}`
        : `HTTP ${res.status}: ${JSON.stringify(detail).slice(0, 500)}`;
    const err = new Error(message);
    // @ts-ignore
    err.status = res.status;
    throw err;
  }

  return parsed ?? text ?? null;
}

// Convenience alias if other modules import it
export const apiFetch = jsonFetch;

// ✅ Hard-coded working login route
export async function login({ email, empId }) {
  return jsonFetch("/auth/login", {
    method: "POST",
    body: { email, empId },
  }); // expects { token, user }
}

// Uploader unchanged
export async function uploadFile({
  file, title, description, tags, fileType, automation, subPractice
}) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("title", title || "Untitled");
  fd.append("fileType", fileType || "POWERPOINT");
  fd.append("description", description || "");

  (Array.isArray(tags) ? tags : String(tags || "")
    .split(",")
    .map(t => t.trim())
    .filter(Boolean)
  ).forEach(t => fd.append("tags[]", t));

  if (automation != null) fd.append("automation", String(automation));
  if (subPractice) fd.append("subPractice", subPractice);

  return jsonFetch("/api/files", { method: "POST", body: fd });
}