from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def get_auth_headers():
    client.post("/auth/register", json={"username": "testuser", "password": "testpass"})
    res = client.post("/auth/login", data={"username": "testuser", "password": "testpass"})
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_list_applications_starts_empty() -> None:
    headers = get_auth_headers()
    response = client.get("/applications", headers=headers)
    assert response.status_code == 200
    assert response.json() == []


def test_create_application() -> None:
    headers = get_auth_headers()
    payload = {
        "company": "Google", "position": "Backend Developer", "status": "applied",
        "location": "Tel Aviv", "applied_date": "2026-03-25",
        "source": "LinkedIn", "notes": "Sent CV through LinkedIn", "favorite": False
    }
    response = client.post("/applications", json=payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["company"] == "Google"
    assert data["position"] == "Backend Developer"
    assert data["status"] == "applied"
    assert data["location"] == "Tel Aviv"
    assert data["applied_date"] == "2026-03-25"
    assert data["source"] == "LinkedIn"
    assert data["notes"] == "Sent CV through LinkedIn"
    assert data["favorite"] is False


def test_get_application_by_id() -> None:
    headers = get_auth_headers()
    create_response = client.post("/applications", json={
        "company": "Microsoft", "position": "QA Engineer", "status": "saved",
        "location": "Herzliya", "applied_date": "2026-03-24",
        "source": "Company Website", "notes": "Need to update CV first", "favorite": True
    }, headers=headers)
    application_id = create_response.json()["id"]
    response = client.get(f"/applications/{application_id}", headers=headers)
    assert response.status_code == 200
    assert response.json()["company"] == "Microsoft"


def test_update_application() -> None:
    headers = get_auth_headers()
    create_response = client.post("/applications", json={
        "company": "Amazon", "position": "DevOps Engineer", "status": "saved",
        "location": "Haifa", "applied_date": "2026-03-20",
        "source": "Referral", "notes": "Need to prepare for application", "favorite": False
    }, headers=headers)
    application_id = create_response.json()["id"]
    response = client.put(f"/applications/{application_id}", json={
        "company": "Amazon", "position": "DevOps Engineer", "status": "interview",
        "location": "Haifa", "applied_date": "2026-03-20",
        "source": "Referral", "notes": "First interview scheduled", "favorite": True
    }, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "interview"
    assert data["favorite"] is True


def test_delete_application() -> None:
    headers = get_auth_headers()
    create_response = client.post("/applications", json={
        "company": "Apple", "position": "Software Engineer", "status": "applied",
        "location": "Remote", "applied_date": "2026-03-21",
        "source": "LinkedIn", "notes": "Waiting for response", "favorite": False
    }, headers=headers)
    application_id = create_response.json()["id"]
    assert client.delete(f"/applications/{application_id}", headers=headers).status_code == 204
    assert client.get(f"/applications/{application_id}", headers=headers).status_code == 404


def test_get_missing_application_returns_404() -> None:
    headers = get_auth_headers()
    response = client.get("/applications/999", headers=headers)
    assert response.status_code == 404
    assert response.json()["detail"] == "Application not found"


def test_update_missing_application_returns_404() -> None:
    headers = get_auth_headers()
    response = client.put("/applications/999", json={
        "company": "Google", "position": "Backend Developer", "status": "applied",
        "location": "Tel Aviv", "applied_date": "2026-03-25",
        "source": "LinkedIn", "notes": "Sent CV", "favorite": False
    }, headers=headers)
    assert response.status_code == 404
    assert response.json()["detail"] == "Application not found"


def test_create_application_with_missing_required_field_returns_422() -> None:
    headers = get_auth_headers()
    response = client.post("/applications", json={"position": "Backend Developer", "status": "applied"}, headers=headers)
    assert response.status_code == 422


def test_create_application_with_invalid_status_returns_422() -> None:
    headers = get_auth_headers()
    response = client.post("/applications", json={
        "company": "Google", "position": "Backend Developer", "status": "invalid_status",
        "location": "Tel Aviv", "applied_date": "2026-03-25",
        "source": "LinkedIn", "notes": "Sent CV", "favorite": False
    }, headers=headers)
    assert response.status_code == 422


def test_users_see_only_their_own_applications() -> None:
    # User A creates an application
    client.post("/auth/register", json={"username": "userA", "password": "passA"})
    res_a = client.post("/auth/login", data={"username": "userA", "password": "passA"})
    headers_a = {"Authorization": f"Bearer {res_a.json()['access_token']}"}
    client.post("/applications", json={
        "company": "CompanyA", "position": "Dev", "status": "applied",
        "location": None, "applied_date": None, "source": None, "notes": None, "favorite": False
    }, headers=headers_a)

    # User B registers and should see empty list
    client.post("/auth/register", json={"username": "userB", "password": "passB"})
    res_b = client.post("/auth/login", data={"username": "userB", "password": "passB"})
    headers_b = {"Authorization": f"Bearer {res_b.json()['access_token']}"}
    response = client.get("/applications", headers=headers_b)
    assert response.json() == []
