import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .database import engine, Base, SessionLocal
from .models import User
from .config import settings
from .routers import auth, projects, analytics, alerts, documents, users, reports, audit, feedback

# Initialize FastAPI App
app = FastAPI(
    title="Civclens API",
    description="Civclens Integrated Project-Monitoring Platform Backend",
    version="1.0.0"
)

# Enable CORS (Cross-Origin Resource Sharing)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to Vite dev server URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(analytics.router)
app.include_router(alerts.router)
app.include_router(documents.router)
app.include_router(users.router)
app.include_router(reports.router)
app.include_router(audit.router)
app.include_router(feedback.router)

# Mount static uploads directory for document previews
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

@app.on_event("startup")
def startup_event():
    """
    Runs on backend start.
    Creates SQLite database and seeds default data if tables are empty.
    """
    print("Initializing Database...")
    Base.metadata.create_all(bind=engine)
    
    # Check if database has users. If not, auto-seed realistic demo projects.
    db = SessionLocal()
    try:
        user_count = db.query(User).count()
        if user_count == 0:
            print("No users found. Triggering database seeder...")
            from .seed import seed_db
            seed_db()
        else:
            print("Database already contains data. Skipping seeder.")
    except Exception as e:
        print(f"Startup database initialization error: {e}")
    finally:
        db.close()

@app.get("/")
def read_root():
    return {
        "status": "Healthy",
        "app": "Civclens Monitoring Platform",
        "version": "1.0.0",
        "docs_url": "/docs"
    }
