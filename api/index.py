import sys
import os

# Configure paths for local execution and Vercel serverless lambdas
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.abspath(os.path.join(current_dir, ".."))
backend_dir = os.path.join(root_dir, "backend")

for p in [backend_dir, root_dir, current_dir, os.path.join(os.getcwd(), "backend")]:
    if os.path.exists(p) and p not in sys.path:
        sys.path.insert(0, p)

try:
    from app.main import app
except ImportError:
    try:
        from backend.app.main import app
    except Exception as e:
        from fastapi import FastAPI
        app = FastAPI(title="CivicLens API")
        @app.get("/api/health")
        def health():
            return {"status": "fallback", "message": str(e)}

# Top-level instance for Vercel
app = app
