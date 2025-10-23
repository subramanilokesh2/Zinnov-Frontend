// src/api.js
// Build the API base from your Netlify env var (set in Netlify dashboard).
// We strip any trailing slash to avoid //api double slashes.
const API_BASE = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');

export const apiUrl = (path = '') => {
  const p = String(path || '');
  return `${API_BASE}${p.startsWith('/') ? p : `/${p}`}`;
};

// Optional: helper for common fetch options
export const jsonFetch = (path, options = {}) =>
  fetch(apiUrl(path), {
    headers: { 'content-type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
