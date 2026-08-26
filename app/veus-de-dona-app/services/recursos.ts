import api from "./api";
import { Recurs } from "../types";

export async function getRecursosByText(textId: string): Promise<Recurs[]> {
  const { data } = await api.get(`/recursos/text/${textId}`);
  return data;
}

export async function getRecursUrl(recursId: string): Promise<string> {
  const { data } = await api.get(`/recursos/${recursId}/url`);
  return data.url;
}

export async function pujarRecurs(
  textId: string,
  tipus: "AUDIO" | "VIDEO",
  fitxer: { uri: string; name: string; type: string }
): Promise<Recurs> {
  const formData = new FormData();
  formData.append("text_id", textId);
  formData.append("tipus", tipus);
  formData.append("file", fitxer as unknown as Blob);
  const { data } = await api.post("/recursos/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function esborrarRecurs(id: string): Promise<void> {
  await api.delete(`/recursos/${id}`);
}
