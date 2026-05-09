from datetime import timedelta

import pytest
from fastapi.testclient import TestClient

from app.auth import create_access_token
from app.main import app

client = TestClient(app)


def get_token(username="admin", password="secret") -> str:
    response = client.post(
        "/auth/login",
        data={"username": username, "password": password},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


def test_login_returns_token():
    response = client.post(
        "/auth/login",
        data={"username": "admin", "password": "secret"},
    )
    assert response.status_code == 200
    body = response.json()
    assert "access_token" in body
    assert body["token_type"] == "bearer"


def test_login_wrong_password_returns_401():
    response = client.post(
        "/auth/login",
        data={"username": "admin", "password": "wrong"},
    )
    assert response.status_code == 401


def test_login_unknown_user_returns_401():
    response = client.post(
        "/auth/login",
        data={"username": "nobody", "password": "secret"},
    )
    assert response.status_code == 401


def test_me_with_valid_token():
    token = get_token()
    response = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json() == {"username": "admin"}


def test_me_without_token_returns_401():
    response = client.get("/auth/me")
    assert response.status_code == 401


def test_me_with_expired_token_returns_401():
    expired_token = create_access_token("admin", expires_delta=timedelta(seconds=-1))
    response = client.get("/auth/me", headers={"Authorization": f"Bearer {expired_token}"})
    assert response.status_code == 401
    assert "expired" in response.json()["detail"].lower()


def test_me_with_invalid_token_returns_401():
    response = client.get("/auth/me", headers={"Authorization": "Bearer not.a.valid.token"})
    assert response.status_code == 401
