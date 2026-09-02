import axios from "axios";
import { getToken } from "./auth";

// Les variables EXPO_PUBLIC_* s'incrusten en compilar. Amb un mòbil real cal
// definir EXPO_PUBLIC_API_URL al .env: localhost només val als emuladors.
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
