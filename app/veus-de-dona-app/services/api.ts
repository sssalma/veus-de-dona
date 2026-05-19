import axios from "axios";
import { getToken } from "./auth";

const api = axios.create({
  baseURL: "http://192.168.17.151:8000",
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
