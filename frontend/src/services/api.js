import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080/api", // your backend endpoint
});

export default api;