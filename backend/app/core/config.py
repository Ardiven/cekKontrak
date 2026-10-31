from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional
import dotenv


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    PROJECT_NAME: str = "CekKontrak API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"

    # LLM Settings
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-3.8-flash"
    GEMINI_EMBEDDING_MODEL: str = "gemini-embedding-001"
    # Model cadangan Gemini bila model utama sibuk (503) atau kena limit (429)
    GEMINI_FALLBACK_MODEL: Optional[str] = "gemini-3.5-flash-lite"
    GROQ_API_KEY: Optional[str] = None
    GROQ_MODEL: str = "openai/gpt-oss-120b"

    # Supabase (Optional for cloud storage & auth)
    SUPABASE_URL: Optional[str] = None
    SUPABASE_KEY: Optional[str] = None

    # Constraints
    MAX_FILE_SIZE_MB: int = 10
    MAX_PAGES: int = 25
    MAX_TEXT_LENGTH: int = 100_000

    # Jumlah pasal per 1 request LLM. Kuota gratis Gemini hanya ~5 request/menit,
    # jadi semua pasal dikirim sekaligus (1 kontrak = 1-2 request), bukan 1 request per pasal.
    LLM_BATCH_SIZE: int = 15
    # Tunggu maksimal sekian detik bila API meminta "retry in Xs" (429)
    LLM_MAX_RETRY_WAIT: int = 20
    # Jumlah batch yang dikirim bersamaan (kuota gratis ~5 request/menit, jadi 3 masih aman)
    LLM_PARALLEL_BATCHES: int = 3
    # Model yang membalas 503 (sedang sibuk) dilewati selama sekian detik
    LLM_BUSY_COOLDOWN: int = 120

    # Local Storage
    DATABASE_PATH: str = "cekkontrak.db"


settings = Settings()
