# Job Application Tracker

A simple FastAPI backend service for managing job applications.

This project was developed as part of EX1 and demonstrates a clean and minimal REST API using FastAPI, Pydantic, SQLModel, and pytest.

---

## Features

* Create a job application
* List all job applications
* Get a job application by ID
* Update a job application
* Delete a job application

---

## Tech Stack

* Python 3.11+
* FastAPI
* Pydantic
* SQLModel (SQLite)
* Uvicorn
* pytest

---

## API Endpoints

### Applications

| Method | Path                    | Description                     |
|--------|-------------------------|---------------------------------|
| GET    | /applications           | Get all applications           |
| GET    | /applications/{id}      | Get application by ID          |
| POST   | /applications           | Create a new application       |
| PUT    | /applications/{id}      | Update an application          |
| DELETE | /applications/{id}      | Delete an application          |

---

### Health Check

| Method | Path     | Description                  |
|--------|----------|------------------------------|
| GET    | /health  | Check if API is running      |


## Project Structure

```
job-application-tracker/
├── app/
│   ├── __init__.py
│   ├── main.py                  # FastAPI app entry point
│   ├── db.py                    # Database configuration (SQLite)
│   ├── models.py                # SQLModel database models
│   ├── schemas.py               # Pydantic schemas
│   └── routes/
│       ├── __init__.py
│       └── applications.py      # API routes
├── tests/
│   └── test_applications.py     # API tests
├── pyproject.toml
├── README.md
└── .gitignore
```

---

## Setup

### 1. Create virtual environment

```bash
uv venv
```

### 2. Activate environment

```bash
source .venv/bin/activate
```

### 3. Install dependencies

```bash
uv sync --dev
```

---

## Running the API

Start the server:

```bash
uv run uvicorn app.main:app --reload
```

The API will be available at:

* API: http://127.0.0.1:8000
* Docs (Swagger): http://127.0.0.1:8000/docs

---

## Running Tests

Run all tests:

```bash
uv run pytest
```

Expected output:

```
7 passed
```

---

## Seed Script

To populate the database with sample data:

```bash
uv run python scripts/seed.py
```

## Example Request

```json
{
  "company": "Google",
  "position": "Backend Developer",
  "status": "applied",
  "location": "Tel Aviv",
  "applied_date": "2026-03-25",
  "source": "LinkedIn",
  "notes": "Sent CV",
  "favorite": false
}
```

---

## Design

The project follows a simple layered architecture:

* Routes layer – handles HTTP requests
* Schemas layer – validates input/output data using Pydantic
* Models layer – defines database structure using SQLModel
* Database layer – manages persistence using SQLite

The project initially used an in-memory repository and was later upgraded to SQLite for persistence, while keeping the same architecture.

---

## AI Assistance

This project was developed with the support of AI tools (e.g., ChatGPT) during the development process.

### How AI was used:

- Exploring different approaches for structuring the project (routes, repository, schemas)
- Understanding FastAPI and SQLModel integration patterns
- Getting explanations for errors and debugging issues during development
- Refining API design and improving code readability

### How outputs were verified:

- All generated code was manually reviewed and fully understood before being used
- The application was tested locally using pytest to ensure all tests pass
- Endpoints were verified manually using the Swagger UI (/docs)
- Additional validation was done by running the seed script and checking database behavior
