from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import parades, autores, textos, auth, visites, likes, comentaris, recursos, usuaris, metriques

app = FastAPI(
    title="Veus de Dona API",
    description="API per a la ruta literària de les 13 escriptores per la Part Alta de Tarragona",
    version="0.1.0"
)
# Origen obert perquè l'app hi arriba des de qualsevol IP de la xarxa local.
# allow_credentials=False perquè l'autenticació va per capçalera Bearer i no per
# cookies: amb credencials, allow_origins=["*"] no és vàlid segons la CORS.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(parades.router)
app.include_router(autores.router)
app.include_router(textos.router)
app.include_router(auth.router)
app.include_router(visites.router)
app.include_router(likes.router)
app.include_router(comentaris.router)
app.include_router(recursos.router)
app.include_router(usuaris.router)
app.include_router(metriques.router)


@app.get("/")
def root():
    return {"missatge": "Veus de Dona API funcionant"}