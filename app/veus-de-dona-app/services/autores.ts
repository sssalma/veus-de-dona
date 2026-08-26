import api from "./api";
import { Autora } from "../types";

export async function getAutores(): Promise<Autora[]> {
  const { data } = await api.get("/autores/");
  return data;
}

export async function getAutora(id: string): Promise<Autora> {
  const { data } = await api.get(`/autores/${id}`);
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
