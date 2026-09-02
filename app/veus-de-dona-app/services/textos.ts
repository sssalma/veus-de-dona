import api from "./api";
import { TextDto } from "../types";

export async function getTextosByParada(paradaId: string, idioma?: string): Promise<TextDto[]> {
  const { data } = await api.get(`/textos/parada/${paradaId}`, {
    params: idioma ? { idioma } : undefined,
  });
  return data;
}

export async function getTextosByAutora(autoraId: string, idioma?: string): Promise<TextDto[]> {
  const { data } = await api.get(`/textos/autora/${autoraId}`, {
    params: idioma ? { idioma } : undefined,
  });
  return data;
}

// Sense idioma: serveixen el panell d'edició, que edita l'original en català.
export async function getText(id: string): Promise<TextDto> {
  const { data } = await api.get(`/textos/${id}`);
  return data;
}

export async function updateText(id: string, dades: Partial<TextDto>): Promise<TextDto> {
  const { data } = await api.patch(`/textos/${id}`, dades);
  return data;
}

export async function getAllTextos(): Promise<TextDto[]> {
  const { data } = await api.get("/textos/");
  return data;
}
