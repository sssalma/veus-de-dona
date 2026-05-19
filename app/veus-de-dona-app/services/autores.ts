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
