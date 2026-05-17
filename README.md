# Job Application Tracker

A full-stack job application tracker with JWT authentication, per-user data isolation, an async background worker, and an AI career advisor microservice.

Users can register, log in, track applications through a visual pipeline, mark favorites, export to CSV, view dashboard charts, and chat with an AI career advisor powered by Google Gemini.

---

## Architecture

```
┌─────────────┐    ┌───────────────────┐    ┌───────────────┐
│  React SPA  │───▶│  FastAPI Backend   │───▶│  PostgreSQL   │
│  Vite       │    │  JWT Auth          │    │  SQLModel     │
│  :5173      │    │  :8000             │    │  :5433        │
└─────────────┘    └───────────────────┘    └───────────────┘
       │                     │
       │             ┌───────▼───────┐
       │             │  Redis        │
       │             │  worker TTL   │
       │             │  :6379        │
       │             └───────────────┘
       ▼
┌─────────────┐    ┌───────────────────┐
│  AI Advisor │───▶│  ai_service        │
│  chat UI    │    │  google-genai SDK  │
│             │    │  Gemini            │
└─────────────┘    │  :8001             │
                   └───────────────────┘
```

Five Docker services in total: `db`, `redis`, `api`, `worker`, `ai_service`.

---

## Services

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:5173 | React SPA (run separately with `npm run dev`) |
| API | http://localhost:8000 | FastAPI backend |
| API Docs | http://localhost:8000/docs | Swagger UI |
| AI Service | http://localhost:8001 | Google Gemini career advisor |
| PostgreSQL | localhost:5433 | Database (Docker only) |
| Redis | localhost:6379 | Worker idempotency cache |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | Python 3.11 |
| Backend framework | FastAPI |
| ORM | SQLModel |
| Database | PostgreSQL 16 (Docker) / SQLite (tests) |
| Auth | JWT (PyJWT) + bcrypt |
| Async worker | asyncio + Redis |
| Package manager | uv |
| Frontend | React 18 + Vite |
| AI | Google Gemini via google-genai SDK |
| Containerisation | Docker + Docker Compose |
| Tests | pytest + httpx |

---

## Features

- **JWT authentication** — register, login, 30-minute token expiry, per-user data isolation
- **Full CRUD** — create, read, update, delete job applications
- **Dashboard** — summary cards, status donut chart, monthly applications bar chart
- **Favorites** — mark roles, dedicated favorites view with separate metrics
- **Search, filter, sort** — by status, company, keyword, applied date
- **CSV export** — download visible applications as a spreadsheet
- **AI Career Advisor** — chat UI backed by Google Gemini (interview tips, salary advice, cover letters)
- **Async refresh worker** — detects stale applications with Redis idempotency (24h TTL)
- **Role-based access** — `is_admin` flag, `GET /admin/stats` returns 403 for non-admins
- **Dark mode** — persisted in localStorage

---

## Requirements

| Tool | Purpose |
|------|---------|
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | Runs all backend services (PostgreSQL, Redis, API, Worker, AI) |
| [Node.js 18+](https://nodejs.org/) | Runs the React frontend dev server |
| [Google API Key](https://aistudio.google.com/app/apikey) | Powers the AI Career Advisor (free tier available) |
| [uv](https://github.com/astral-sh/uv) | Python package manager — only needed for local dev / running tests |

---

## Quick Start (Docker Compose)

```bash
# 1. Set up your environment file
cp .env.example .env
# Edit .env and add your Google Gemini API key (free at https://aistudio.google.com/app/apikey)

# 2. Start all backend services
docker compose up --build

# Run in the background (optional)
docker compose up --build -d

# 3. Seed the database with demo data (see "Seed Script" section below)
docker compose exec api python -m scripts.seed
# → Login credentials: demo / demo1234

# 4. Start the frontend (separate terminal)
cd frontend && npm install && npm run dev
# → http://localhost:5173

# To stop all services
docker compose down
```

---

## Running Locally (without Docker)

```bash
# Backend
uv venv && source .venv/bin/activate
uv sync --dev
uv run uvicorn app.main:app --reload
# → http://localhost:8000  |  Swagger: http://localhost:8000/docs

# Frontend (separate terminal)
cd frontend && npm install && npm run dev
# → http://localhost:5173
```

> Tests use SQLite automatically — no Docker required for `uv run pytest`.

---

## Seed Script

Populates the database with a demo user and sample job applications.

```bash
docker compose exec api python -m scripts.seed
```

**What it creates:**

| Field | Value |
|-------|-------|
| Username | `demo` |
| Password | `demo1234` |
| Applications | 3 sample jobs (Google, Microsoft, Amazon) |
| Statuses | `applied`, `interview`, `saved` |

The script is **idempotent** — running it twice will not duplicate data.

---

## Demo Script

Runs the full end-to-end flow: starts services, seeds data, exercises the API, runs the worker, and prints all URLs.

```bash
bash scripts/demo.sh
```

---

## Running Tests

```bash
# All backend tests (36 tests, no Docker needed)
uv run pytest tests/ -v

# Frontend tests
cd frontend && npm test -- --run
```

**Test coverage:**

| File | Tests | What it covers |
|------|-------|----------------|
| `test_applications.py` | 10 | Full CRUD, 404/422 errors, per-user isolation |
| `test_auth.py` | 11 | Register, login, JWT expiry, invalid token, role checks |
| `test_refresh.py` | 11 | Stale detection, Redis idempotency, async worker flow |
| `test_ai_service.py` | 4 | Health, suggest endpoint, validation |

---

## API Reference

### Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | — | Create account (`{"username", "password"}`) |
| POST | `/auth/login` | — | Get JWT token (form data) |
| GET | `/auth/me` | Bearer | Current user info |

### Applications (all require Bearer token)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/applications` | List your applications |
| POST | `/applications` | Create application |
| GET | `/applications/{id}` | Get by ID |
| PUT | `/applications/{id}` | Update |
| DELETE | `/applications/{id}` | Delete |

### Admin

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/admin/stats` | Bearer + `is_admin=True` | Total users and applications |

### System

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | API liveness check |

### AI Service (`localhost:8001`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | AI service liveness check |
| POST | `/chat` | Free-form career question |
| POST | `/suggest` | Interview prep for a specific role |

---

## Project Structure

```
.
├── app/
│   ├── auth.py              # JWT creation/validation, bcrypt, require_admin
│   ├── db.py                # SQLModel engine + session (PostgreSQL or SQLite)
│   ├── main.py              # FastAPI app, CORS, /health, /admin/stats
│   ├── models.py            # User (with is_admin), JobApplication, ApplicationStatus
│   ├── schemas.py           # Pydantic request/response schemas with validation
│   └── routes/
│       ├── applications.py  # CRUD routes, all JWT-protected, filtered by user_id
│       └── auth.py          # /register, /login, /me
├── ai_service/
│   ├── agent.py             # google-genai wrapper (generate_text function)
│   ├── main.py              # /chat, /suggest endpoints with CORS
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── main.jsx         # React entry point
│   │   ├── App.jsx          # Main app — auth state, routing, data fetching
│   │   ├── App.css          # All UI styles (light + dark mode)
│   │   ├── constants.js     # API base URLs, status config
│   │   ├── utils.js         # Shared helper functions
│   │   └── components/
│   │       ├── Login.jsx          # Split-screen login form
│   │       ├── Register.jsx       # Split-screen register form (auto-redirects to login)
│   │       ├── Sidebar.jsx        # Navigation + user info + logout
│   │       ├── AiAdvisor.jsx      # Chat UI with suggestion cards
│   │       ├── ApplicationCard.jsx
│   │       ├── ApplicationForm.jsx
│   │       ├── FilterBar.jsx
│   │       ├── StatusBadge.jsx
│   │       ├── StatusChart.jsx
│   │       └── ApplicationsByMonthPanel.jsx
│   └── tests/
│       └── App.test.jsx     # Frontend integration test (add application flow)
├── scripts/
│   ├── demo.sh              # End-to-end walkthrough script
│   ├── refresh.py           # Async stale-app worker (JWT auth + Redis idempotency)
│   └── seed.py              # Creates demo user + sample applications
├── tests/
│   ├── conftest.py          # SQLite test DB, autouse reset fixture, dependency override
│   ├── test_applications.py
│   ├── test_auth.py
│   ├── test_refresh.py      # pytest.mark.anyio async tests
│   └── test_ai_service.py
├── docs/
│   ├── EX3-notes.md         # Architecture, Redis trace, JWT rotation steps
│   └── runbooks/
│       └── compose.md       # Docker Compose operations + CI guide
├── compose.yaml
├── Dockerfile
├── pyproject.toml
├── .env.example             # Environment variable template
└── requests.http            # Manual API examples (IDE HTTP client)
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | SQLite fallback | PostgreSQL connection string (set by Docker Compose) |
| `SECRET_KEY` | `dev-secret-...` | JWT signing key — change before sharing |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection |
| `GOOGLE_API_KEY` | — | Gemini API key for the AI service |
| `LLM_MODEL` | `gemini-2.5-flash` | Gemini model name |
| `WORKER_USERNAME` | `demo` | Service account for the refresh worker |
| `WORKER_PASSWORD` | `demo1234` | Service account password |

---

## Security Notes

- Passwords hashed with bcrypt (random salt per user)
- JWT signed HS256, expires after 30 minutes
- All application routes filter by `current_user.id` — users cannot see each other's data
- `SECRET_KEY` should be replaced with `python -c "import secrets; print(secrets.token_hex(32))"` before any real deployment
- `.env` is gitignored

---

## AI Assistance

This project was developed with support from Claude Code.

- Architecture design and service integration
- FastAPI, SQLModel, JWT, and bcrypt implementation
- React frontend components and styling
- Async worker, Redis idempotency pattern
- Test suite and documentation
- Code was reviewed and tested at each step
