import api from "./api";
import { Comentari } from "../types";

export async function getComentaris(paradaId: string): Promise<Comentari[]> {
  const { data } = await api.get(`/comentaris/parada/${paradaId}`);
  return data;
}

export async function getTotsElsComentaris(): Promise<Comentari[]> {
  const { data } = await api.get("/comentaris/");
  return data;
}

export async function afegirComentari(paradaId: string, contingut: string): Promise<Comentari> {
  const { data } = await api.post("/comentaris/", { parada_id: paradaId, contingut });
  return data;
}

export async function eliminarComentari(id: string): Promise<void> {
  await api.delete(`/comentaris/${id}`);
}

export async function respondreComentari(id: string, resposta_editor: string): Promise<Comentari> {
  const { data } = await api.patch(`/comentaris/${id}/resposta`, { resposta_editor });
  return data;
}
