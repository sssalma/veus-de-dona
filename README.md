# Veus de Dona

«Veus de dona a Tarragona» és un projecte nascut d'un grup de treball de
professionals de l'ensenyament secundari que proposa recórrer la ciutat des
d'una perspectiva femenina. Aplega textos, biografies, traduccions, materials
didàctics i àudios enregistrats per alumnat, repartits en diverses ubicacions i
itineraris.

Aquesta aplicació mòbil (React Native + Expo, amb un backend FastAPI) dona
suport a un d'aquests itineraris: la Ruta de les 13 escriptores per la Part
Alta, de deu parades. Permet seguir-les sobre el mapa, llegir els textos al lloc
que els va inspirar, escoltar-ne les lectures i deixar constància de la visita.
També es pot fer des de casa.

L'aplicació és un Treball de Fi de Grau plantejat com una proposta
d'aprenentatge servei, la metodologia que uneix l'aprenentatge acadèmic amb un
servei a la comunitat dins d'un mateix projecte: el servei és per al grup de
treball que hi ha darrere de la ruta, que passa a disposar d'una eina per
seguir-la sobre el terreny.

Web del projecte: https://sites.google.com/view/veusdedona/

## Requisits

- Docker Desktop, amb `docker compose`
- Node.js 18 o superior, amb npm
- Git
- L'aplicació Expo Go al telèfon mòbil
  ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent&hl=ca) ·
  [iOS](https://apps.apple.com/es/app/expo-go/id982107779))

No cal instal·lar ni Python, ni PostgreSQL, ni MinIO: s'executen dins de
contenidors. No calen registres addicionals de cap servei extern.

## Execució

Clonar el repositori:

```bash
git clone https://github.com/sssalma/veus-de-dona.git
cd veus-de-dona
```

Crear el fitxer `.env` a l'arrel del repositori, que contingui:

```
MINIO_URL=http://LA_TEVA_IP:9000
SECRET_KEY=una_clau_que_vulguis
```

`LA_TEVA_IP` és la IP local de l'ordinador (`ipconfig` a Windows, `ifconfig` a
macOS i Linux). El telèfon i l'ordinador han de ser a la mateixa xarxa WiFi.

Aixecar els contenidors. Les migracions d'esquema s'apliquen soles en arrencar,
i l'API queda a `http://localhost:8000`:

```bash
docker compose up -d
```

Poblar el contingut i crear el compte d'administració:

```bash
docker compose exec backend python -m scripts.poblar --admin admin@veusdedona.cat admin1234
```

Crear el fitxer `.env` dins d'`app/veus-de-dona-app/` apuntant al servei:

```
EXPO_PUBLIC_API_URL=http://LA_TEVA_IP:8000
```

En una altra terminal, instal·lar i arrencar l'aplicació:

```bash
cd app/veus-de-dona-app
npm install
npx expo start
```

Escanejar el codi QR que apareix a la terminal des del telèfon: a iOS, amb
l'aplicació de càmera, que obrirà Expo Go amb el projecte; a Android, des de
dins d'Expo Go (*Scan QR code*).

## Llicència

El codi d'aquest repositori es distribueix amb llicència MIT (veure
[`LICENSE`](LICENSE)).

Els enregistraments de `AUDIOS_TFG/` **no** hi estan coberts: són obra del
projecte «Veus de dona a Tarragona» i es distribueixen amb llicència Creative
Commons BY-NC-SA 4.0 (veure [`AUDIOS_TFG/LLICENCIA.md`](AUDIOS_TFG/LLICENCIA.md)).
