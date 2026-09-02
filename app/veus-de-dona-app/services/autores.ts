import api from "./api";
import { Autora, TraduccioAutora } from "../types";

export async function getAutores(idioma?: string): Promise<Autora[]> {
  const { data } = await api.get("/autores/", { params: idioma ? { idioma } : undefined });
  return data;
}

export async function getAutora(id: string, idioma?: string): Promise<Autora> {
  const { data } = await api.get(`/autores/${id}`, { params: idioma ? { idioma } : undefined });
  return data;
}

export async function updateAutora(id: string, dades: Partial<Autora>): Promise<Autora> {
  const { data } = await api.patch(`/autores/${id}`, dades);
  return data;
}

export async function getAutoraFoto(id: string): Promise<string> {
  const { data } = await api.get(`/autores/${id}/foto`);
  return data.url;
}

export async function updateAutoraFoto(
  id: string,
  foto: { uri: string; name: string; type: string }
): Promise<Autora> {
  const formData = new FormData();
  formData.append("file", foto as unknown as Blob);
  const { data } = await api.post(`/autores/${id}/foto`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

// traduccions de la biografia: només edició

export async function getTraduccionsAutora(id: string): Promise<TraduccioAutora[]> {
  const { data } = await api.get(`/autores/${id}/traduccions`);
  return data;
}

export async function setTraduccioAutora(
  id: string,
  idioma: string,
  bio: string
): Promise<TraduccioAutora> {
  const { data } = await api.put(`/autores/${id}/traduccions/${idioma}`, { bio });
  return data;
}

export async function esborraTraduccioAutora(id: string, idioma: string): Promise<void> {
  await api.delete(`/autores/${id}/traduccions/${idioma}`);
}
