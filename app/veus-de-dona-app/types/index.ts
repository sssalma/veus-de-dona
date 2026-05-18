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

export interface Text {
  id: string;
  titol: string;
  obra_origen: string | null;
  contingut: string;
  parada_id: string;
  autora_id: string;
}

export interface Usuari {
  id: string;
  email: string;
  nom: string;
  rol: string;
}
