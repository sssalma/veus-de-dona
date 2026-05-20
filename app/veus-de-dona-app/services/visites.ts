import api from "./api";
import { Visita } from "../types";

export async function registrarVisita(paradaId: string, lat?: number, lng?: number): Promise<Visita> {
  const { data } = await api.post("/visites/", { parada_id: paradaId, lat, lng });
  return data;
}

export async function getMevesVisites(): Promise<Visita[]> {
  const { data } = await api.get("/visites/me");
  return data;
}
