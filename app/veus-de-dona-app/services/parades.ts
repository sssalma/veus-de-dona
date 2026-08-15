import api from "./api";
import { Parada } from "../types";

export async function getParades(): Promise<Parada[]> {
  const { data } = await api.get("/parades/");
  return data;
}

export async function getParada(id: string): Promise<Parada> {
  const { data } = await api.get(`/parades/${id}`);
  return data;
}

export async function getParadaFoto(id: string): Promise<string> {
  const { data } = await api.get(`/parades/${id}/foto`);
  return data.url;
}

export async function updateParada(id: string, dades: Partial<Parada>): Promise<Parada> {
  const { data } = await api.patch(`/parades/${id}`, dades);
  return data;
}

export async function toggleParadaActiva(id: string, activa: boolean): Promise<Parada> {
  const { data } = await api.patch(`/parades/${id}/activa`, null, { params: { activa } });
  return data;
}
