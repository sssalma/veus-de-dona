/**
 * Extreu un missatge llegible d'un error de l'API.
 *
 * El `detail` que retorna FastAPI no sempre té la mateixa forma:
 *
 *   - Els errors que llancem nosaltres amb `HTTPException` porten un text:
 *     `{"detail": "Credencials incorrectes"}`
 *   - Els errors de validació de Pydantic (422) porten una llista d'objectes:
 *     `{"detail": [{"loc": [...], "msg": "value is not a valid email address"}]}`
 *
 * Passar la segona forma a `Alert.alert()` fa caure l'aplicació, perquè espera
 * una cadena. Aquesta funció normalitza els dos casos i retorna sempre text.
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
 * Comprovació de format mínima abans d'enviar el correu al servidor.
 *
 * El servidor el torna a validar amb `EmailStr` -aquesta funció no el
 * substitueix-, però si deixem que hi arribi un correu mal escrit, la resposta
 * és un 422 amb el text de validació de Pydantic en anglès. Comprovant-ho aquí
 * l'usuari rep el missatge en el seu idioma.
 */
export function correuSemblaValid(correu: string): boolean {
  return /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(correu.trim());
}
