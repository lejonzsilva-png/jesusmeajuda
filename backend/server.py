import sys
import os

# Adiciona o diretório atual ao caminho de busca do Python
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Agora pode fazer o import normalmente
from routers import api_router
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
# IMPORTANTE: Mantenha aqui as suas importações originais (motor, db, etc)
from routers import api_router # Exemplo, ajuste conforme seu código original

app = FastAPI()

# Definição do diretório raiz e do build do frontend
ROOT_DIR = Path(__file__).resolve().parent.parent
frontend_build_path = os.path.join(ROOT_DIR, "frontend", "build")

# 1. Inclua suas rotas de API (Mantenha as suas originais)
app.include_router(api_router)

# 2. Servir arquivos estáticos do React
if os.path.exists(os.path.join(frontend_build_path, "static")):
    app.mount("/static", StaticFiles(directory=os.path.join(frontend_build_path, "static")), name="static")

# 3. Rota para servir o PWA
@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    # Se a rota começar com 'api', o FastAPI ignora e deixa passar para o Router
    if full_path.startswith("api"):
        raise HTTPException(status_code=404, detail="Not found")
    
    file_path = os.path.join(frontend_build_path, full_path)
    
    # Se o arquivo existe, serve ele (favicon, manifest, etc)
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return FileResponse(file_path)
    
    # Caso contrário, retorna o index.html (SPA)
    return FileResponse(os.path.join(frontend_build_path, "index.html"))

# Se o seu código original tinha um evento de startup ou shutdown, mantenha abaixo:
# @app.on_event("startup")
# async def startup_db_client():
#     ...