from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import parades, autores, textos

# FastAPI instance with API metadata for auto-generated Swagger docs
app = FastAPI(
    title="Veus de Dona API",
    description="API per a la ruta literària de les 13 escriptores per la Part Alta de Tarragona",
    version="0.1.0"
)
# allow requests from any origin (React Native app)
# PER CANVIAR EN PRODUCCIÓ: restringir allow_origins a domini específic
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# register routers
app.include_router(parades.router)
app.include_router(parades.router)
app.include_router(autores.router)
app.include_router(textos.router)


# health check endpoint
@app.get("/")
def root():
    return {"missatge": "Veus de Dona API funcionant"}