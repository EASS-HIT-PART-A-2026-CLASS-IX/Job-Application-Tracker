# Docker Compose Runbook

## Services

| Service | Description | Port |
|---------|-------------|------|
| `api` | FastAPI backend | 8000 |
| `redis` | Redis (idempotency store) | 6379 |
| `worker` | Async refresh worker | — |

## Start everything

```bash
docker compose up --build
```

The API is ready when you see `Application startup complete`.

## Run just the worker (one-shot)

```bash
docker compose run --rm worker
```

## Check logs

```bash
docker compose logs api
docker compose logs worker
```

## Stop and remove containers

```bash
docker compose down
```

To also delete the database volume:

```bash
docker compose down -v
```

## Startup order

Redis → API (waits for `/health` to return 200) → Worker
