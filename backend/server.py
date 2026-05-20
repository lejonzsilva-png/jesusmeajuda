import sys
import os
from pathlib import Path

# Adiciona o diretório 'backend' ao caminho do sistema para que os imports funcionem
# __file__ é o caminho deste arquivo (backend/server.py)
# os.path.dirname(__file__) é o caminho da pasta 'backend'
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from routers import api_router # Agora deve funcionar!

app = FastAPI()

# Definição do diretório raiz
BASE_DIR = Path(__file__).resolve().parent.parent
frontend_build_path = os.path.join(BASE_DIR, "frontend", "build")

# 1. Inclua as rotas
app.include_router(api_router)

# 2. Servir arquivos estáticos
static_dir = os.path.join(frontend_build_path, "static")
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")

# 3. Rota PWA
@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    if full_path.startswith("api"):
        raise HTTPException(status_code=404, detail="Not found")
    
    file_path = os.path.join(frontend_build_path, full_path)
    
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return FileResponse(file_path)
    
    return FileResponse(os.path.join(frontend_build_path, "index.html"))