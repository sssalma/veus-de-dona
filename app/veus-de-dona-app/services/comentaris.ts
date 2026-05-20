import api from "./api";
import { Comentari } from "../types";

export async function getComentaris(paradaId: string): Promise<Comentari[]> {
  const { data } = await api.get(`/comentaris/parada/${paradaId}`);
  return data;
}

export async function afegirComentari(paradaId: string, contingut: string): Promise<Comentari> {
  const { data } = await api.post("/comentaris/", { parada_id: paradaId, contingut });
  return data;
}
