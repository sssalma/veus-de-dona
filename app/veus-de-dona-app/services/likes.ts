import api from "./api";
import { TextDto } from "../types";

// Recompte públic: per a qui no ha iniciat sessió
export async function getLikesCount(textId: string): Promise<number> {
  const { data } = await api.get(`/likes/${textId}/count`);
  return data.likes;
}

export async function checkLike(textId: string): Promise<{ liked: boolean; count: number }> {
  const { data } = await api.get(`/likes/${textId}/check`);
  return data;
}

export async function addLike(textId: string): Promise<void> {
  await api.post(`/likes/${textId}`);
}

export async function removeLike(textId: string): Promise<void> {
  await api.delete(`/likes/${textId}`);
}

// Els textos marcats per qui té la sessió oberta, del més recent al més antic.
export async function getTextosPreferits(idioma?: string): Promise<TextDto[]> {
  const { data } = await api.get("/likes/me", {
    params: idioma ? { idioma } : undefined,
  });
  return data;
}
