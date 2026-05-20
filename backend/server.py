import sys
import os
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# 1. Configuração prioritária do caminho de busca do Python
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# 2. Importação segura das rotas
try:
    from routers import api_router
except ImportError:
    # Fallback caso o seu arquivo routers.py ainda esteja configurando o APIRouter
    from fastapi import APIRouter
    api_router = APIRouter()

app = FastAPI()

# Definição do diretório raiz e do build do frontend (React)
ROOT_DIR = Path(__file__).resolve().parent.parent
frontend_build_path = os.path.join(ROOT_DIR, "frontend", "build")

# Inclui as suas rotas de API
app.include_router(api_router)

# Servir arquivos estáticos do React (CSS, JS, Imagens)
static_dir = os.path.join(frontend_build_path, "static")
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Rota curinga para servir o PWA / React SPA
@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    if full_path.startswith("api"):
        raise HTTPException(status_code=404, detail="Not found")
    
    file_path = os.path.join(frontend_build_path, full_path)
    
    # Se o arquivo físico existir (manifest.json, favicon.ico, etc.), serve ele
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return FileResponse(file_path)
    
    # Caso contrário, serve o index.html para o React gerenciar o roteamento
    index_path = os.path.join(frontend_build_path, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    
    return {"error": "Frontend build não encontrado. Verifique o comando de compilação."}

# --- O BLOCO QUE FALTAVA PARA MANTER O SERVIDOR ONLINE ---
if __name__ == "__main__":
    import uvicorn
    # O Render fornece a porta correta por meio da variável de ambiente PORT
    port = int(os.environ.get("PORT", 10000))
    uvicorn.run(app, host="0.0.0.0", port=port)