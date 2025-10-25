// frontend/src/services/api.js
import axios from "axios";

/**
 * If REACT_APP_API_URL is set (no trailing slash), use it.
 * Otherwise default to "/api" which works with CRA's "proxy" option
 * in package.json during development.
 */
const base = process.env.REACT_APP_API_URL
  ? process.env.REACT_APP_API_URL.replace(/\/$/, "") + "/api"
  : "/api";

const api = axios.create({
  baseURL: base,
  timeout: 15000, // ms - increased timeout for registration
});

// Create a separate instance for registration with longer timeout
export const registrationApi = axios.create({
  baseURL: base,
  timeout: 30000, // 30 seconds for registration to handle email sending
});

export default api;
