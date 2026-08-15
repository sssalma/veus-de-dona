import api from "./api";
import { Usuari } from "../types";

export async function getUsuaris(): Promise<Usuari[]> {
  const { data } = await api.get("/usuaris/");
  return data;
}

export async function setUsuariActiu(id: string, actiu: boolean): Promise<Usuari> {
  const { data } = await api.patch(`/usuaris/${id}/actiu`, { actiu });
  return data;
}

export async function setUsuariRol(id: string, rol: string): Promise<Usuari> {
  const { data } = await api.patch(`/usuaris/${id}/rol`, { rol });
  return data;
}

export async function setMeuIdioma(idioma: string): Promise<Usuari> {
  const { data } = await api.patch("/usuaris/me", { idioma });
  return data;
}
