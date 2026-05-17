from fastapi.testclient import TestClient

import ai_service.agent as agent_module
from ai_service.main import app

client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_suggest_returns_advice(monkeypatch):
    monkeypatch.setattr(agent_module, "generate_text", lambda prompt: "Mock interview advice")

    response = client.post(
        "/suggest",
        json={"company": "Google", "position": "Software Engineer"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["company"] == "Google"
    assert body["position"] == "Software Engineer"
    assert isinstance(body["advice"], str)
    assert len(body["advice"]) > 0


def test_suggest_missing_field_returns_422():
    response = client.post("/suggest", json={"company": "Google"})
    assert response.status_code == 422


def test_suggest_different_roles(monkeypatch):
    monkeypatch.setattr(agent_module, "generate_text", lambda prompt: "Mock career advice")

    for company, position in [
        ("Amazon", "Data Scientist"),
        ("Startup", "Backend Developer"),
    ]:
        response = client.post(
            "/suggest",
            json={"company": company, "position": position},
        )
        assert response.status_code == 200
        assert response.json()["company"] == company
