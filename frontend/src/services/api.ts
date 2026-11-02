import axios from "axios";

const configuredBaseURL = (
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8000/api"
)
  .trim()
  .replace(/\/+$/, "");

// Ensure the base URL contains exactly one /api suffix.
const API_BASE_URL = /\/api$/i.test(configuredBaseURL)
  ? configuredBaseURL
  : `${configuredBaseURL}/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;