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
  timeout: 8000, // ms - fail fast if backend hangs
});

export default api;
