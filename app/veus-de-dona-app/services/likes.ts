import api from "./api";

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
