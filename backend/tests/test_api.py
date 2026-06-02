from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)
HEADERS = {"Authorization": "Bearer demo-token-12345"}


def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}


def test_chat_sin_token_rechazado():
    res = client.post("/api/chat", json={"message": "Hola", "session_id": "test-123"})
    assert res.status_code in (401, 403)


def test_login_token_invalido():
    res = client.post("/auth/login", json={"email": "user@test.com", "password": "token-incorrecto"})
    assert res.status_code == 401


def test_login_exitoso():
    res = client.post("/auth/login", json={"email": "user@test.com", "password": "demo-token-12345"})
    assert res.status_code == 200
    assert res.json()["token"] == "demo-token-12345"


def test_chat_con_token_y_llm_mockeado():
    # Usa la clave de estado correcta: "mensajes" (no "messages")
    respuesta_falsa = {"mensajes": [MagicMock(content="Respuesta mockeada")]}
    with patch("main.agente") as mock_agente:
        mock_agente.invoke = MagicMock(return_value=respuesta_falsa)
        res = client.post(
            "/api/chat",
            json={"message": "¿Cuál es la política de devoluciones?", "session_id": "test-session"},
            headers=HEADERS,
        )
    assert res.status_code == 200
    assert "response" in res.json()
    assert res.json()["response"] == "Respuesta mockeada"


def test_historial_sesion_nueva():
    res = client.get("/api/chat/history/sesion-inexistente", headers=HEADERS)
    assert res.status_code == 200
    assert res.json()["messages"] == []
