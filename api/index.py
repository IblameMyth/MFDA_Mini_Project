import sys
from pathlib import Path

# Vercel loads this module from /api; make the project-level Flask app importable.
PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
	sys.path.insert(0, str(PROJECT_ROOT))

from app import app

