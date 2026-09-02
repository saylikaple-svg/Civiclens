import os
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

# Enable SQLite WAL (Write-Ahead Logging) only in local development.
# Skip WAL mode on Vercel serverless environment to prevent disk I/O errors on /tmp filesystem.
if settings.DATABASE_URL.startswith("sqlite") and not os.environ.get("VERCEL"):
    try:
        with engine.connect() as con:
            con.execute("PRAGMA journal_mode=WAL;")
    except Exception:
        pass

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

_db_initialized = False

def init_db_once():
    """
    Lazily initializes database tables and seeds demo data on first request
    if running in a fresh serverless container.
    """
    global _db_initialized
    if not _db_initialized:
        try:
            os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
            Base.metadata.create_all(bind=engine)
            
            needs_seed = False
            db = SessionLocal()
            try:
                from .models import User
                if db.query(User).count() == 0:
                    needs_seed = True
            except Exception as e:
                print(f"Database count check notice: {e}")
                needs_seed = True
            finally:
                db.close()
                
            if needs_seed:
                try:
                    from .seed import seed_db
                    seed_db()
                except Exception as e:
                    print(f"Database seed notice: {e}")
                    
            _db_initialized = True
        except Exception as e:
            print(f"Database initialization notice: {e}")

def get_db():
    init_db_once()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
