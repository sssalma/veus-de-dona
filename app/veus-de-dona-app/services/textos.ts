import api from "./api";
import { TextDto } from "../types";

export async function getTextosByParada(paradaId: string): Promise<TextDto[]> {
  const { data } = await api.get(`/textos/parada/${paradaId}`);
  return data;
}

export async function getTextosByAutora(autoraId: string): Promise<TextDto[]> {
  const { data } = await api.get(`/textos/autora/${autoraId}`);
  return data;
}
