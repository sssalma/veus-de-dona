import { TranslationKey } from "./translations";

type Traductor = (key: TranslationKey) => string;

/**
 * Els enums del backend arriben en majúscules, tal com es desen. Aquí es
 * tradueixen a etiquetes, perquè no s'ensenyin mai directament.
 */

export const ORDRE_MODES = ["GUIAT", "LLIURE", "REMOT"] as const;
export const ORDRE_ROLS = ["VISITANT", "EDITOR", "ADMINISTRADOR"] as const;

/** L'idioma de la interfície no és un codi vàlid per a `toLocaleDateString`. */
export const LOCALE_PER_IDIOMA: Record<string, string> = {
  CA: "ca-ES",
  ES: "es-ES",
  EN: "en-GB",
};

export function localeDe(idioma: string): string {
  return LOCALE_PER_IDIOMA[idioma] ?? "ca-ES";
}

export function etiquetaMode(t: Traductor, mode: string): string {
  switch (mode) {
    case "GUIAT":
      return t("parada.mode.GUIAT");
    case "LLIURE":
      return t("parada.mode.LLIURE");
    case "REMOT":
      return t("parada.mode.REMOT");
    default:
      return mode;
  }
}

export function etiquetaRol(t: Traductor, rol: string): string {
  switch (rol) {
    case "ADMINISTRADOR":
      return t("perfil.administrador");
    case "EDITOR":
      return t("perfil.editor");
    case "VISITANT":
      return t("perfil.visitant");
    default:
      return rol;
  }
}

/**
 * Ordena les entrades d'un Record segons una llista fixa, amb les claus que no
 * hi són al final. Sense això l'ordre pot canviar entre peticions.
 */
export function ordenaPer<T>(
  dades: Record<string, T>,
  ordre: readonly string[]
): [string, T][] {
  const entrades = Object.entries(dades);
  return entrades.sort((a, b) => {
    const ia = ordre.indexOf(a[0]);
    const ib = ordre.indexOf(b[0]);
    return (ia === -1 ? ordre.length : ia) - (ib === -1 ? ordre.length : ib);
  });
}
