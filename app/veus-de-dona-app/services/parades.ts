import api from "./api";
import { Parada } from "../types";

export async function getParades(): Promise<Parada[]> {
  const { data } = await api.get("/parades/");
  return data;
}

export async function getTotesLesParades(): Promise<Parada[]> {
  const { data } = await api.get("/parades/totes");
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

export async function updateParadaFoto(
  id: string,
  foto: { uri: string; name: string; type: string }
): Promise<Parada> {
  const formData = new FormData();
  formData.append("file", foto as unknown as Blob);
  const { data } = await api.post(`/parades/${id}/foto`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}
