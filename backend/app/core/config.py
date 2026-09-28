"""
ClinixLens Backend — Core Configuration
"""
from pydantic_settings import BaseSettings
from typing import Optional, List
import os


class Settings(BaseSettings):
    # App
    app_env: str = "development"
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    debug: bool = True
    secret_key: str = "change-this-to-a-random-secret-key"

    # Database
    database_url: str = "sqlite+aiosqlite:///./clinixlens.db"

    # AI
    gemini_api_key: str = ""
    gemini_model: str = "gemini-1.5-flash"

    # OCR
    google_cloud_vision_api_key: str = ""
    google_cloud_project: Optional[str] = None
    google_application_credentials: Optional[str] = None

    # CORS
    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    # Upload
    max_upload_size_mb: int = 20
    upload_dir: str = "./uploads"

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]

    @property
    def max_upload_size_bytes(self) -> int:
        return self.max_upload_size_mb * 1024 * 1024

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    @property
    def is_sqlite(self) -> bool:
        return "sqlite" in self.database_url

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
        extra = "ignore"


settings = Settings()

# Ensure upload directory exists
os.makedirs(settings.upload_dir, exist_ok=True)
