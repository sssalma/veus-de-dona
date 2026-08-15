import api from "./api";
import { MetriquesGlobal, MetriquesParada } from "../types";

export async function getMetriquesGlobal(): Promise<MetriquesGlobal> {
  const { data } = await api.get("/metriques/global");
  return data;
}

export async function getMetriquesParades(): Promise<MetriquesParada[]> {
  const { data } = await api.get("/metriques/parades");
  return data;
}
