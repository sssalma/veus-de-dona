export interface Parada {
  id: string;
  ordre: number;
  nom_espai: string;
  coordenades: string;
  foto_minio_key: string | null;
  activa: boolean;
  lat: number | null;
  lng: number | null;
}

export interface Autora {
  id: string;
  nom: string;
  cognom: string;
  bio: string | null;
  // En quin idioma ve la `bio`. Quan no hi ha traduccio el servidor torna el
  // catala i ho diu aqui, perque la fitxa ho pugui advertir en comptes de
  // fer-lo passar per traduit.
  bio_idioma: "CA" | "ES" | "EN";
  anys_vida: string | null;
  foto_minio_key: string | null;
}

export interface TraduccioAutora {
  idioma: "CA" | "ES" | "EN";
  bio: string;
}

export interface TextDto {
  id: string;
  titol: string;
  obra_origen: string | null;
  contingut: string;
  youtube_url: string | null;
  parada_id: string;
  autora_id: string;
  autora?: Autora;
}

export interface Usuari {
  id: string;
  email: string;
  nom: string;
  cognom: string;
  rol: string;
  idioma: string;
  data_registre: string;
  actiu: boolean;
  procedencia: string | null;
  es_alumne: boolean | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  nom: string;
  cognom: string;
  password: string;
  idioma?: string;
  procedencia?: string;
  es_alumne?: boolean;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface Recurs {
  id: string;
  tipus: "AUDIO" | "VIDEO";
  minio_key: string;
  text_id: string;
}

export interface Visita {
  id: string;
  timestamp: string;
  mode: "REMOT" | "GUIAT" | "LLIURE";
  parada_id: string;
  usuari_id: string;
}

export interface Comentari {
  id: string;
  contingut: string;
  data_creacio: string;
  parada_id: string;
  // Nomes arriben per a editors i administradors: al llistat public els
  // comentaris van signats amb el nom de pila i sense identificador.
  usuari_id?: string | null;
  usuari_nom?: string | null;
  usuari_cognom?: string | null;
  resposta_editor?: string | null;
  resposta_data?: string | null;
}

export interface MetriquesGlobal {
  usuaris_per_rol: Record<string, number>;
  usuaris_grup_escolar: number;
  visites_per_mode: Record<string, number>;
  textos_mes_agradats: { text_id: string; titol: string; likes: number }[];
}

export interface MetriquesParada {
  parada_id: string;
  nom_espai: string;
  ordre: number;
  visites_per_mode: Record<string, number>;
  likes: number;
  comentaris: number;
}
