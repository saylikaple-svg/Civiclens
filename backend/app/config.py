import os
from pydantic import field_validator
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
    
    @field_validator("ACCESS_TOKEN_EXPIRE_MINUTES", mode="before")
    def parse_expire_minutes(cls, v):
        if v is None or v == "" or (isinstance(v, str) and not v.strip()):
            return 1440
        try:
            return int(v)
        except Exception:
            return 1440

    @field_validator("DATABASE_URL", mode="before")
    def parse_db_url(cls, v):
        if not v or not str(v).strip():
            return f"sqlite:///{_DEFAULT_DB}"
        return str(v)

    @field_validator("UPLOAD_DIR", mode="before")
    def parse_upload_dir(cls, v):
        if not v or not str(v).strip():
            return _DEFAULT_UPLOADS
        return str(v)
    
    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

# Ensure uploads folder exists
try:
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
except Exception:
    pass
