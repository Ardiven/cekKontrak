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
    GEMINI_MODEL: str = "gemini-2.5-flash"
    GROQ_API_KEY: Optional[str] = None
    GROQ_MODEL: str = "llama-3.3-70b-versatile"

    # Supabase (Optional for cloud storage & auth)
    SUPABASE_URL: Optional[str] = None
    SUPABASE_KEY: Optional[str] = None

    # Constraints
    MAX_FILE_SIZE_MB: int = 10
    MAX_PAGES: int = 25
    MAX_TEXT_LENGTH: int = 100_000

    # Local Storage
    DATABASE_PATH: str = "cekkontrak.db"


settings = Settings()
