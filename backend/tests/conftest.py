import os
import pytest

# Env vars antes de cualquier import de la app
os.environ.setdefault("OPENAI_API_KEY", "fake-key-for-tests")
os.environ.setdefault("DEMO_TOKEN", "demo-token-12345")
os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost:5173")


@pytest.fixture(autouse=True)
def env_vars(monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", "fake-key-for-tests")
    monkeypatch.setenv("DEMO_TOKEN", "demo-token-12345")
