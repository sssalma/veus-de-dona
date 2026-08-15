import axios from "axios";
import { getToken } from "./auth";

// EXPO_PUBLIC_* env vars are inlined at build time (Expo SDK 54+).
// Set EXPO_PUBLIC_API_URL in .env for your machine/deployment; falls back to
// localhost (works in Android/iOS simulators, not on a physical device on LAN).
const baseURL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
