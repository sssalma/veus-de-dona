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
