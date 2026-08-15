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
