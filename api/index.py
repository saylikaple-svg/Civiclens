import sys
import os

# Add paths
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
backend_dir = os.path.join(root_dir, "backend")

for p in [backend_dir, os.path.join(os.getcwd(), "backend"), root_dir]:
    if os.path.exists(p) and p not in sys.path:
        sys.path.insert(0, p)

from app.main import app

# Ensure app is top-level
app = app
