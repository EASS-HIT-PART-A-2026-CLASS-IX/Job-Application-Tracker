import pytest
from fastapi.testclient import TestClient
from pydantic_ai.models.test import TestModel

import ai_service.agent as agent_module
from ai_service.main import app

client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_suggest_returns_advice(monkeypatch):
    from pydantic_ai import Agent

    test_agent = Agent(TestModel(), system_prompt="advisor")
    monkeypatch.setattr(agent_module, "_agent", test_agent)

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
    from pydantic_ai import Agent

    test_agent = Agent(TestModel(), system_prompt="advisor")
    monkeypatch.setattr(agent_module, "_agent", test_agent)

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
