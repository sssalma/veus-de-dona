# Veus de Dona

Aplicació mòbil multiplataforma (React Native + Expo) de suport a la ruta literària "Veus de Dona": 13 escriptores, 10 parades geolocalitzades a la Part Alta de Tarragona.

## Requisits previs

- [Docker](https://www.docker.com/products/docker-desktop/) ( amb `docker compose`)
- [Node.js](https://nodejs.org/) >= 18 i npm
- Expo CLI (`npx` ja ve inclòs amb npm)

---

## 1. Engegar el backend (Docker)

Des de l'arrel del repo:

```bash
docker compose up -d
```

Això aixeca tres serveis:
- **PostgreSQL** (port 5432) — base de dades
- **MinIO** (port 9000 API / 9001 consola) — emmagatzematge d'arxius (fotos, àudios)
- **FastAPI** (port 8000) — API REST

Les migracions d'Alembic s'executen automàticament a l'inici del contenidor backend.

---

## 2. Poblar la base de dades

Un cop el backend està aixecat, executa els scripts de seed dins del contenidor:

```bash
# Parades (10 punts de la ruta)
docker compose exec backend python -m scripts.seed_parades

# Autores (13 escriptores, fa scraping de la web oficial)
docker compose exec backend python -m scripts.scraper_autores

# Neteja tipografica de les biografies (cal despres de cada passada del scraper:
# el scraping perd els espais on hi havia etiquetes HTML i deixa paraules enganxades)
docker compose exec backend python -m scripts.neteja_bios --aplica

# Textos (poemes i fragments vinculats a autores i parades)
docker compose exec backend python -m scripts.seed_textos

# Biografies en castella i angles (cal fer-ho despres de les autores)
docker compose exec backend python -m scripts.seed_traduccions_autores

# Compte d'administrador (canvia email i password si cal)
docker compose exec backend python scripts/seed_admin.py admin@veusdedona.cat admin1234

# URLs de YouTube (opcional)
docker compose exec backend python -m scripts.seed_youtube_urls

# Fotos de parades (opcional, fa scraping)
docker compose exec backend python -m scripts.scraper_fotos_parades

# Audios de les lectures (els MP3 ja son al repo, a AUDIOS_TFG/)
docker compose exec backend python -m scripts.seed_audios
```

### Els enregistraments de les lectures

Els 17 MP3 son a `AUDIOS_TFG/`, que el contenidor munta automaticament: no cal
fer res mes que executar el seed.

**Aquests fitxers no estan coberts per la llicencia MIT.** Son obra del grup
promotor i de l'alumnat del projecte «Veus de dona a Tarragona», i es
distribueixen amb llicencia Creative Commons BY-NC-SA 4.0: es poden
redistribuir amb atribucio, no se'n pot fer us comercial i les obres derivades
han de mantenir les mateixes condicions. Els detalls son a
[`AUDIOS_TFG/LLICENCIA.md`](AUDIOS_TFG/LLICENCIA.md).

---

## 3. Engegar el frontend

```bash
cd app/veus-de-dona-app
npm install
npx expo start
```

Cal tenir instal·lada l'app **Expo Go** al mòbil. La manera d'obrir el projecte
no és la mateixa als dos sistemes:

- **iOS**: escaneja el QR amb l'app **Càmera** del sistema, no des de dins d'Expo Go.
  Surt una notificació que obre el projecte. No cal cap compte d'Expo.
- **Android**: escaneja el QR des de dins d'Expo Go (opció *Scan QR code*).

Si en arrencar surt `Unable to run simctl` és perquè no hi ha les eines de línia
d'ordres de Xcode instal·lades. Només afecta el simulador d'iOS; amb un mòbil real
es pot ignorar.

### Si fas servir un mòbil físic

Assegura't que el telèfon i l'ordinador estan a la **mateixa xarxa WiFi**. L'API ha d'accedir-se per IP local.

1. Troba la IP de l'ordinador (`ipconfig` a Windows / `ifconfig` a macOS/Linux).
2. Crea un fitxer `.env` dins de `app/veus-de-dona-app/`:
   ```
   EXPO_PUBLIC_API_URL=http://LA_TEVA_IP:8000
   ```
3. Reinicia Expo (`npx expo start --clear`).

Si fas servir l'emulador/ simulator, `http://localhost:8000` funciona directament.

---

## 4. Provar l'app

1. Obre l'app des d'Expo Go.
2. **Pantalla d'inici**: mapa amb les 10 parades de la ruta.
3. **Registrar-se / Iniciar sessió**: crea un compte o fes login.
4. **Fitxa de parada**: toca una parada al mapa per veure textos, biografia de l'autora, àudio i vídeo.
5. **Pantalla d'autores**: llistat de les 13 escriptores.
6. **Perfil**: idioma (CA/ES/EN), dades de l'usuari.
7. **Panell d'administrador** (només si tens rol d'admin): gestió de parades, autores, textos, comentaris i usuaris.

---

## 5. Tests (opcional)

```bash
cd backend
python -m pytest -v
```

Els tests fan servir una base de dades separada (`veusdedona_test`). Cal crear-la una vegada:

```bash
docker compose exec db psql -U admin -d postgres -c "CREATE DATABASE veusdedona_test;"
```

---

## Estructura del projecte

```
veus-de-dona/
├── docker-compose.yml          # Backend + Postgres + MinIO
├── backend/
│   ├── app/
│   │   ├── main.py             # Entrada FastAPI
│   │   ├── models/             # Models SQLAlchemy
│   │   ├── routers/            # Endpoints REST
│   │   ├── schemas/            # Schemas Pydantic
│   │   └── services/           # Lògica de negoci
│   ├── alembic/                # Migracions de BD
│   ├── scripts/                # Seeds i utilitats
│   └── tests/                  # Tests amb pytest
├── app/veus-de-dona-app/
│   ├── app/                    # Pantalles (Expo Router)
│   ├── components/             # Components React Native
│   ├── contexts/               # Auth, idioma
│   ├── services/               # Clients API
│   └── i18n/                   # Traduccions (CA/ES/EN)
```
