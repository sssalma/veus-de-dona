/**
 * Extreu un missatge llegible d'un error de l'API. El `detail` de FastAPI és
 * un text als errors propis i una llista d'objectes als 422 de Pydantic;
 * `Alert.alert()` cau si li arriba la llista, així que aquí sempre surt text.
 */
export function missatgeError(err: any, perDefecte: string): string {
  const detail = err?.response?.data?.detail;

  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }

  // 422 de Pydantic: una entrada per camp que no ha validat
  if (Array.isArray(detail)) {
    const missatges = detail
      .map((e) => (typeof e === "string" ? e : e?.msg))
      .filter((m): m is string => typeof m === "string" && m.length > 0);
    if (missatges.length > 0) {
      return missatges.join("\n");
    }
  }

  return perDefecte;
}

/**
 * Comprovació de format del correu abans d'enviar-lo. El servidor el torna a
 * validar amb `EmailStr`; comprovar-ho aquí evita un 422 amb text en anglès.
 */
export function correuSemblaValid(correu: string): boolean {
  return /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(correu.trim());
}
