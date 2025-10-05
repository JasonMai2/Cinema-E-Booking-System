// frontend/src/services/api.js
import axios from "axios";

const base = process.env.REACT_APP_API_URL
  ? process.env.REACT_APP_API_URL.replace(/\/$/, "") + "/api"
  : "http://localhost:8080/api";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "/api"
  // optional: timeout: 8000
});

export default api;
