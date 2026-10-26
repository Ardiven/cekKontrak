from fastapi import APIRouter
from backend.app.api.endpoints import analyze, chat, documents, export, sample

api_router = APIRouter()

api_router.include_router(analyze.router, tags=["Analisis Kontrak"])
api_router.include_router(chat.router, tags=["Chatbot RAG"])
api_router.include_router(documents.router, tags=["Riwayat Dokumen"])
api_router.include_router(export.router, tags=["Ekspor PDF"])
api_router.include_router(sample.router, tags=["Contoh Kontrak"])
