import sys
import os
from pathlib import Path

# --- CORREÇÃO DO CAMINHO DE IMPORTAÇÃO ---
# Adiciona o diretório onde este ficheiro (server.py) está localizado ao sys.path
# Isto permite que o Python encontre o ficheiro 'routers.py' que está na mesma pasta
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

# Agora que o caminho está configurado, podemos importar o que precisamos
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from routers import api_router  # Agora isto funcionará!

app = FastAPI()

# --- CORREÇÃO DOS CAMINHOS PARA O FRONTEND ---
# O server.py está em 'backend/'. 
# O diretório raiz do repositório é o pai de 'backend/'.
# A pasta 'frontend/' está ao lado da 'backend/'.
BASE_DIR = Path(__file__).resolve().parent.parent
frontend_build_path = os.path.join(BASE_DIR, "frontend", "build")

# 1. Incluir rotas da API
app.include_router(api_router)

# 2. Servir arquivos estáticos do React (se existirem)
static_dir = os.path.join(frontend_build_path, "static")
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")

# 3. Rota para servir o PWA
@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    # Ignora rotas que começam com 'api' para deixar o Router tratar
    if full_path.startswith("api"):
        raise HTTPException(status_code=404, detail="Not found")
    
    file_path = os.path.join(frontend_build_path, full_path)
    
    # Se o arquivo existe (favicon.ico, manifest.json, etc.), serve-o
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return FileResponse(file_path)
    
    # Caso contrário, serve o index.html (SPA)
    index_path = os.path.join(frontend_build_path, "index.html")
    return FileResponse(index_path)