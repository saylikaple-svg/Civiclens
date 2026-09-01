import sys
import os

# Get directory paths
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(current_dir)
backend_dir = os.path.join(root_dir, "backend")

# Ensure paths are added to sys.path
for path in [backend_dir, root_dir]:
    if path not in sys.path:
        sys.path.insert(0, path)

try:
    from app.main import app
except ImportError:
    from backend.app.main import app
