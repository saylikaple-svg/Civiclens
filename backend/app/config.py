import os
from pydantic_settings import BaseSettings

_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_DEFAULT_DB = "/tmp/projectpulse.db" if os.environ.get("VERCEL") else os.path.join(_BACKEND_DIR, "projectpulse.db")
_DEFAULT_UPLOADS = "/tmp/uploads" if os.environ.get("VERCEL") else os.path.join(_BACKEND_DIR, "uploads")

class Settings(BaseSettings):
    DATABASE_URL: str = f"sqlite:///{_DEFAULT_DB}"
    JWT_SECRET: str = "sih2026_super_secret_projectpulse_key_jwt_token_12345"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    UPLOAD_DIR: str = _DEFAULT_UPLOADS
    
    # LLM & OCR API Config (falls back to local processing / rules if not provided)
    GEMINI_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    
    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

# Ensure uploads folder exists
try:
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
except Exception:
    pass
