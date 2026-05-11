from datetime import timedelta

from fastapi.testclient import TestClient

from app.auth import create_access_token
from app.main import app

client = TestClient(app)


def register(username="admin", password="secret"):
    return client.post("/auth/register", json={"username": username, "password": password})


def login(username="admin", password="secret"):
    return client.post("/auth/login", data={"username": username, "password": password})


def get_token(username="admin", password="secret") -> str:
    register(username, password)
    response = login(username, password)
    return response.json()["access_token"]


def test_register_creates_user():
    response = register()
    assert response.status_code == 201
    assert response.json()["username"] == "admin"


def test_register_duplicate_returns_400():
    register()
    response = register()
    assert response.status_code == 400


def test_login_returns_token():
    register()
    response = login()
    assert response.status_code == 200
    body = response.json()
    assert "access_token" in body
    assert body["token_type"] == "bearer"


def test_login_wrong_password_returns_401():
    register()
    response = login(password="wrong")
    assert response.status_code == 401


def test_login_unknown_user_returns_401():
    response = login(username="nobody")
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


def test_admin_endpoint_forbidden_for_regular_user():
    token = get_token(username="regular", password="pass1234")
    response = client.get("/admin/stats", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 403
    assert response.json()["detail"] == "Admin access required"


def test_admin_endpoint_requires_token():
    response = client.get("/admin/stats")
    assert response.status_code == 401
