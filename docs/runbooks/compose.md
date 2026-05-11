# Docker Compose Runbook

## Services

| Service | Description | Port |
|---------|-------------|------|
| `db` | PostgreSQL 16 | 5433 (host) |
| `redis` | Redis 7 (idempotency store) | 6379 |
| `api` | FastAPI backend | 8000 |
| `worker` | Async refresh worker | — |
| `ai_service` | Pydantic AI / Gemini advisor | 8001 |

## Start everything

```bash
docker compose up --build
```

The API is ready when you see `Application startup complete`.

## Seed demo data

```bash
docker compose exec api python -m scripts.seed
# Login with: demo / demo1234
```

## Verify health

```bash
curl http://localhost:8000/health
# {"status":"ok"}

curl http://localhost:8001/health
# {"status":"ok"}
```

## Verify response headers

```bash
curl -I http://localhost:8000/health
# HTTP/1.1 200 OK
# content-type: application/json
# x-process-time: ...  (if middleware added)
```

## Run the refresh worker (one-shot)

```bash
docker compose run --rm worker
```

Inspect Redis idempotency keys after the run:

```bash
docker compose exec redis redis-cli KEYS "refresh:*"
docker compose exec redis redis-cli TTL "refresh:processed:1"
```

## Check logs

```bash
docker compose logs api
docker compose logs worker
docker compose logs ai_service
```

## Stop and clean up

```bash
docker compose down          # stop containers
docker compose down -v       # also delete database volume (resets all data)
```

## Startup order

```
db (healthy) → redis (healthy) → api (healthy) → worker
                                              └→ ai_service
```

## Run tests in CI / locally

```bash
# Backend tests (requires no running services — uses SQLite test DB)
uv run pytest tests/ -v

# Run only auth tests
uv run pytest tests/test_auth.py -v

# Run only async refresh tests
uv run pytest tests/test_refresh.py -v

# Frontend tests
cd frontend && npm test -- --run
```

### Environment variables for CI

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | SQLite fallback |
| `SECRET_KEY` | JWT signing secret | `dev-secret-change-in-production-xx` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `GOOGLE_API_KEY` | Google Gemini API key | empty (AI service degrades gracefully) |
| `LLM_MODEL` | Pydantic AI model string | `google-gla:gemini-2.0-flash-lite` |
