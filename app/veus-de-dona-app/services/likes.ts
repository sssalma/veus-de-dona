import api from "./api";
import { TextDto } from "../types";

// Recompte public: el fem servir per ensenyar els likes a qui no ha
// iniciat sessio, que no pot cridar /check perque requereix testimoni.
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

// Els textos que ha marcat qui te la sessio oberta, del mes recent al mes
// antic. El like es desava des del principi; aquesta es la crida que el fa
// recuperable.
export async function getTextosPreferits(idioma?: string): Promise<TextDto[]> {
  const { data } = await api.get("/likes/me", {
    params: idioma ? { idioma } : undefined,
  });
  return data;
}
