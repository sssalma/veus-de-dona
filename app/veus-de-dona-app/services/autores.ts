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
