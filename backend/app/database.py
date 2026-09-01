from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import settings

# Create engine. Connect args are needed for SQLite to handle multi-threading correctly.
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL, connect_args=connect_args
)

# Enable SQLite WAL (Write-Ahead Logging) for better concurrency performance
if settings.DATABASE_URL.startswith("sqlite"):
    try:
        with engine.connect() as con:
            con.execute("PRAGMA journal_mode=WAL;")
    except Exception:
        pass

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
