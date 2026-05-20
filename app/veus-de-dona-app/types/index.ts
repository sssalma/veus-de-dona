export interface Parada {
  id: string;
  ordre: number;
  nom_espai: string;
  coordenades: string;
  foto_minio_key: string | null;
  activa: boolean;
}

export interface Autora {
  id: string;
  nom: string;
  cognom: string;
  bio: string | null;
  anys_vida: string | null;
  foto_minio_key: string | null;
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
  usuari_id: string;
  usuari_nom?: string;
}
