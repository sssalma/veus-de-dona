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
  parada_id: string;
  autora_id: string;
  autora?: Autora;
}

export interface Usuari {
  id: string;
  email: string;
  nom: string;
  rol: string;
}

export interface Recurs {
  id: string;
  tipus: "AUDIO" | "VIDEO";
  minio_key: string;
  text_id: string;
}
