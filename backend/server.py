import sys
import os
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# 1. Configura o caminho para o Python encontrar o pacote 'routers' localmente
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from routers import api_router

app = FastAPI()

# Definição dos caminhos para os ficheiros compilados do React
ROOT_DIR = Path(__file__).resolve().parent.parent
frontend_build_path = os.path.join(ROOT_DIR, "frontend", "build")

# 1. Ativa as rotas da API
app.include_router(api_router)

# 2. Serve os ficheiros estáticos (CSS, JS, Imagens) do React
static_dir = os.path.join(frontend_build_path, "static")
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")

# 3. Rota dinâmica para o PWA / React Router
@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    if full_path.startswith("api"):
        raise HTTPException(status_code=404, detail="Not found")
    
    file_path = os.path.join(frontend_build_path, full_path)
    
    # Se o ficheiro físico existir (ex: manifest.json, favicon.ico), serve-o diretamente
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return FileResponse(file_path)
    
    # Caso contrário, serve o index.html para o React gerir as rotas internas
    index_path = os.path.join(frontend_build_path, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    
    return {"error": "Frontend build não encontrado."}

# 4. Inicialização do Servidor (Mantém a aplicação ativa no Render)
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 10000))
    uvicorn.run(app, host="0.0.0.0", port=port)