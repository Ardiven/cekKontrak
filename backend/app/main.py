import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.app.core.config import settings
from backend.app.api.router import api_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "CekKontrak: AI-Powered Contract Risk Analyzer & Plain-Language Explainer. "
        "Membantu masyarakat awam memahami dokumen perjanjian sebelum menandatanganinya."
    ),
    docs_url="/docs",
    redoc_url="/redoc"
)

# Setup CORS for Frontend dev server (Vite on port 5173, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/health", tags=["System"])
def health_check():
    return {
        "status": "online",
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "gemini_configured": bool(settings.GEMINI_API_KEY),
        "groq_configured": bool(settings.GROQ_API_KEY)
    }


# Static frontend mounting (React dist)
dist_dir = os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist")
assets_dir = os.path.join(dist_dir, "assets")

if os.path.exists(assets_dir):
    app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")


@app.get("/")
def root():
    # If built React bundle exists, serve it
    dist_index = os.path.join(dist_dir, "index.html")
    if os.path.exists(dist_index):
        return FileResponse(dist_index)
    return {
        "message": "Selamat datang di CekKontrak API. Buka /docs untuk dokumentasi Swagger interaktif."
    }
