import os
import sys

# Añade backend/ al path para que 'from main import app' funcione
# tanto cuando pytest se lanza desde la raíz como desde backend/
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Env vars antes de cualquier import de la app (los módulos las leen al importarse)
os.environ.setdefault("OPENAI_API_KEY", "fake-key-for-tests")
os.environ.setdefault("DEMO_TOKEN", "demo-token-12345")
os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost:5173")

import pytest


@pytest.fixture(autouse=True)
def env_vars(monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", "fake-key-for-tests")
    monkeypatch.setenv("DEMO_TOKEN", "demo-token-12345")
