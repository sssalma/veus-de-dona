import api from "./api";
import { TextDto, Parada } from "../types";

export async function getTextosByParada(paradaId: string): Promise<TextDto[]> {
  const { data } = await api.get(`/textos/parada/${paradaId}`);
  return data;
}

export async function getTextosByAutora(autoraId: string): Promise<TextDto[]> {
  const { data } = await api.get(`/textos/autora/${autoraId}`);
  return data;
}

export async function getText(id: string): Promise<TextDto> {
  const { data } = await api.get(`/textos/${id}`);
  return data;
}

export async function updateText(id: string, dades: Partial<TextDto>): Promise<TextDto> {
  const { data } = await api.patch(`/textos/${id}`, dades);
  return data;
}

// No hi ha endpoint per llistar tots els textos; els agrupem per parada.
export async function getAllTextos(): Promise<TextDto[]> {
  const { data: parades } = await api.get<Parada[]>("/parades/");
  const perParada = await Promise.all(
    parades.map((p) => api.get<TextDto[]>(`/textos/parada/${p.id}`).then((r) => r.data))
  );
  return perParada.flat();
}
