# EX3 — Implementation Notes

## Service Architecture

This project runs four cooperating local services orchestrated by Docker Compose:

| Service | Technology | Port | Role |
|---------|-----------|------|------|
| `api` | FastAPI + SQLModel + PostgreSQL | 8000 | REST backend, JWT auth |
| `db` | PostgreSQL 16 | 5433 (host) | Persistent relational storage |
| `redis` | Redis 7 | 6379 | Idempotency store for refresh worker |
| `worker` | Python + httpx + redis-py | — | Async stale-application detector |
| `ai_service` | FastAPI + Pydantic AI + Gemini | 8001 | LLM career advisor microservice |

### Startup order

```
db (healthy) → redis (healthy) → api (healthy) → worker
                                               → ai_service
```

Health checks gate each dependency. The API waits for PostgreSQL to accept connections before starting; the worker waits for the API `/health` to return 200.

---

# Async Refresh Worker

`scripts/refresh.py` implements the async stale-application detector with three key properties:

**Bounded concurrency** — a `asyncio.Semaphore(5)` limits simultaneous in-flight checks so the API is never flooded regardless of how large the applications table grows.

**Retries** — `fetch_applications` retries up to `MAX_RETRIES = 3` times with linear back-off (`0.5 * attempt` seconds) before propagating the error.

**Redis idempotency** — each processed application writes a key `refresh:processed:{id}` with a 24-hour TTL. A second run on the same day skips already-handled records.

### Redis trace excerpt

Run `docker compose run --rm worker` and inspect Redis immediately after:

```
$ docker compose exec redis redis-cli KEYS "refresh:*"
1) "refresh:processed:1"
2) "refresh:processed:2"
3) "refresh:processed:3"

$ docker compose exec redis redis-cli TTL "refresh:processed:1"
(integer) 86342

$ docker compose exec redis redis-cli GET "refresh:processed:1"
"1"
```

Worker stdout for a three-application database:

```
Refreshed 3 applications. 1 stale.
  ! [applied] Backend Developer at Google (id=1)
```

Application id=1 has `applied_date` older than 14 days and status `applied`, so it is flagged. The other two (interview, saved) are not flagged because `offer`/`rejected` statuses are excluded and the date threshold has not been reached.

---

## Session 11 — Security Baseline

### Credential hashing

All passwords are stored as bcrypt hashes using `bcrypt.hashpw` with a per-user random salt. Plain-text passwords never touch the database.

```python
def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()
```

### JWT authentication

Every application route is protected with `Depends(get_current_user)`. Tokens are signed HS256, expire after 30 minutes, and carry the `sub` claim (username).

```python
def create_access_token(subject: str, expires_delta: timedelta | None = None) -> str:
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=30))
    return jwt.encode({"sub": subject, "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)
```

### Role-based access control

The `User` model carries an `is_admin` boolean. The `GET /admin/stats` endpoint requires admin role — any authenticated non-admin receives `403 Forbidden`. The `require_admin` dependency re-uses `get_current_user` and adds the role check:

```python
def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user
```

### Token rotation steps

1. **Generate a new secret** — `python -c "import secrets; print(secrets.token_hex(32))"`
2. **Set the env var** — update `SECRET_KEY` in your `.env` file (never commit this value)
3. **Restart the API** — `docker compose up -d api`
4. **All existing tokens are immediately invalidated** — users must log in again
5. For zero-downtime rotation in production, run two keys in parallel with a grace period; this is out of scope for local development

### Security test coverage

- `test_me_without_token_returns_401` — missing token
- `test_me_with_expired_token_returns_401` — expired token (delta = −1 second)
- `test_me_with_invalid_token_returns_401` — malformed token
- `test_admin_endpoint_forbidden_for_regular_user` — missing role
- `test_admin_endpoint_accessible_for_admin` — valid admin token

---

## Enhancement — AI Career Advisor Microservice

`ai_service/` is a standalone FastAPI service powered by Pydantic AI and Google Gemini. It exposes two endpoints:

- `POST /suggest` — interview preparation advice for a specific role
- `POST /chat` — free-form career questions

The agent uses **lazy initialisation** — `get_agent()` only constructs the Pydantic AI `Agent` on the first request, so the service starts cleanly even if `GOOGLE_API_KEY` is not set.

The React frontend connects directly to `http://localhost:8001` and presents a chat UI with suggestion cards, animated typing indicators, and per-user conversation history.

---

## Additional Features

| Feature | Where |
|---------|-------|
| Per-user data isolation | `JobApplication.user_id` FK, all routes filter by `current_user.id` |
| CSV export | Frontend `exportApplicationsToCsv()` — client-side, no extra endpoint needed |
| Favorites | `favorite` boolean on model, dedicated Favorites view in frontend |
| Dashboard charts | Status donut chart, monthly applications bar chart |
| Search + filter + sort | Client-side filtering in `filteredApplications` memo |
| Dark mode | CSS class toggle persisted in `localStorage` |
