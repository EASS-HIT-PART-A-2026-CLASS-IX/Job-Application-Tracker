from fastapi.testclient import TestClient
from sqlmodel import SQLModel, Session, create_engine

from app.db import get_session
from app.main import app
from app.models import JobApplication

# Create a separate SQLite database for tests
test_engine = create_engine("sqlite:///test.db", echo=False)


def override_get_session():
    with Session(test_engine) as session:
        yield session


app.dependency_overrides[get_session] = override_get_session
client = TestClient(app)


# Reset database before each test
def setup_function() -> None:
    SQLModel.metadata.drop_all(test_engine)
    SQLModel.metadata.create_all(test_engine)


def test_list_applications_starts_empty() -> None:
    response = client.get("/applications")
    assert response.status_code == 200
    assert response.json() == []


def test_create_application() -> None:
    payload = {
        "company": "Google",
        "position": "Backend Developer",
        "status": "applied",
        "location": "Tel Aviv",
        "applied_date": "2026-03-25",
        "source": "LinkedIn",
        "notes": "Sent CV through LinkedIn",
        "favorite": False
    }

    response = client.post("/applications", json=payload)

    assert response.status_code == 201
    data = response.json()
    assert data["id"] == 1
    assert data["company"] == "Google"
    assert data["status"] == "applied"


def test_get_application_by_id() -> None:
    payload = {
        "company": "Microsoft",
        "position": "QA Engineer",
        "status": "saved",
        "location": "Herzliya",
        "applied_date": "2026-03-24",
        "source": "Company Website",
        "notes": "Need to update CV first",
        "favorite": True
    }

    create_response = client.post("/applications", json=payload)
    application_id = create_response.json()["id"]

    response = client.get(f"/applications/{application_id}")

    assert response.status_code == 200
    assert response.json()["company"] == "Microsoft"


def test_update_application() -> None:
    create_payload = {
        "company": "Amazon",
        "position": "DevOps Engineer",
        "status": "saved",
        "location": "Haifa",
        "applied_date": "2026-03-20",
        "source": "Referral",
        "notes": "Need to prepare for application",
        "favorite": False
    }

    create_response = client.post("/applications", json=create_payload)
    application_id = create_response.json()["id"]

    update_payload = {
        "company": "Amazon",
        "position": "DevOps Engineer",
        "status": "interview",
        "location": "Haifa",
        "applied_date": "2026-03-20",
        "source": "Referral",
        "notes": "First interview scheduled",
        "favorite": True
    }

    response = client.put(f"/applications/{application_id}", json=update_payload)

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "interview"
    assert data["favorite"] is True


def test_delete_application() -> None:
    payload = {
        "company": "Apple",
        "position": "Software Engineer",
        "status": "applied",
        "location": "Remote",
        "applied_date": "2026-03-21",
        "source": "LinkedIn",
        "notes": "Waiting for response",
        "favorite": False
    }

    create_response = client.post("/applications", json=payload)
    application_id = create_response.json()["id"]

    delete_response = client.delete(f"/applications/{application_id}")
    assert delete_response.status_code == 204

    get_response = client.get(f"/applications/{application_id}")
    assert get_response.status_code == 404


def test_get_missing_application_returns_404() -> None:
    response = client.get("/applications/999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Application not found"


def test_create_application_with_invalid_status_returns_422() -> None:
    payload = {
        "company": "Google",
        "position": "Backend Developer",
        "status": "invalid_status",
        "location": "Tel Aviv",
        "applied_date": "2026-03-25",
        "source": "LinkedIn",
        "notes": "Sent CV",
        "favorite": False
    }

    response = client.post("/applications", json=payload)

    assert response.status_code == 422