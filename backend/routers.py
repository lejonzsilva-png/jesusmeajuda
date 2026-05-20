# Dentro do arquivo backend/routers.py
from fastapi import APIRouter

api_router = APIRouter()

# Você pode adicionar as suas rotas aqui
@api_router.get("/api/test")
async def root():
    return {"status": "ok"}