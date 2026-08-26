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

export async function updateMeuPerfil(dades: {
  nom?: string;
  cognom?: string;
  procedencia?: string | null;
  es_alumne?: boolean | null;
}): Promise<Usuari> {
  const { data } = await api.patch("/auth/me", dades);
  return data;
}

export async function canviarContrasenya(
  password_actual: string,
  password_nova: string
): Promise<void> {
  await api.post("/auth/canvi-contrasenya", { password_actual, password_nova });
}

/**
 * Assigna una contrasenya nova al compte d'una altra persona. Nomes
 * administracio. No hi ha recuperacio autoservei: aquest es l'unic cami de
 * tornada per a qui ha oblidat la seva.
 */
export async function assignarContrasenya(id: string, password_nova: string): Promise<void> {
  await api.patch(`/usuaris/${id}/contrasenya`, { password_nova });
}
