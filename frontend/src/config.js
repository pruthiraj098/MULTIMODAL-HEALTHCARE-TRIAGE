// ============================================================
// HealthTriage AI - Frontend Configuration
// Centralized configuration for API endpoints and settings
// ============================================================

export const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export const APP_CONFIG = {
  appName: "HealthTriage AI",
  version: "1.0.0",
  defaultLanguage: "en",
  apiUrl: API_URL,
};

export default {
  API_URL,
  APP_CONFIG,
};
