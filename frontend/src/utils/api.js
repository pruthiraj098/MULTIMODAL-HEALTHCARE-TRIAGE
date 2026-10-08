// ============================================================
// HealthTriage AI - Frontend API Client Helper
// Handles tokens, error logging, and standard JSON requests
// ============================================================

import { API_URL } from "../config";

/**
 * Standard fetch wrapper that automatically includes JWT auth header if available.
 */
export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem("token");
  const headers = {
    ...options.headers,
  };

  // Only set Content-Type to json if body is not FormData
  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith("http") ? endpoint : `${API_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  return response;
}

export default {
  apiRequest,
  API_URL,
};
