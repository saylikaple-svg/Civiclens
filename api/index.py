import sys
import os
import traceback

# Determine paths
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.abspath(os.path.join(current_dir, ".."))
backend_dir = os.path.join(root_dir, "backend")

# Add all candidate paths to sys.path
for p in [backend_dir, os.path.join(current_dir, "backend"), os.path.join(os.getcwd(), "backend"), root_dir, current_dir]:
    if os.path.exists(p) and p not in sys.path:
        sys.path.insert(0, p)

try:
    from app.main import app
except Exception as err:
    print(f"Error loading CivicLens backend application: {err}")
    traceback.print_exc()
    from fastapi import FastAPI
    app = FastAPI(title="CivicLens Serverless API")

    @app.get("/")
    @app.get("/api/health")
    def fallback_health():
        return {
            "status": "Serverless Active",
            "message": "CivicLens backend initialized.",
            "diagnostics": str(err)
        }
