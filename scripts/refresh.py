"""
Async refresh worker for the Job Application Tracker.

Fetches all applications from the API, flags ones that have been in an active
status for too long (stale), and reports a summary.

Key behaviours:
- Bounded concurrency: at most CONCURRENCY applications are checked at once.
- Idempotency: Redis marks each processed application for 24 hours so a second
  run on the same day skips already-handled records.
- Retries: transient API errors are retried up to MAX_RETRIES times with
  linear back-off before the error is propagated.
- Auth: the worker logs in as a service account (WORKER_USERNAME / WORKER_PASSWORD)
  to obtain a JWT before fetching applications.
"""

import asyncio
import os
from datetime import date

import httpx
import redis.asyncio as aioredis

API_URL = os.getenv("API_URL", "http://127.0.0.1:8000")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
# Service account credentials — the seed script creates the demo user
WORKER_USERNAME = os.getenv("WORKER_USERNAME", "demo")
WORKER_PASSWORD = os.getenv("WORKER_PASSWORD", "demo1234")
CONCURRENCY = 5
STALE_DAYS = 14
MAX_RETRIES = 3
REDIS_KEY_PREFIX = "refresh:processed:"
REDIS_TTL = 86400  # 24 hours


def is_stale(app: dict) -> bool:
    """Return True if the application has been in an active status too long."""
    if app["status"] in ("offer", "rejected"):
        return False
    applied_date = app.get("applied_date")
    if not applied_date:
        return False
    days = (date.today() - date.fromisoformat(applied_date)).days
    return days >= STALE_DAYS


async def get_token(client: httpx.AsyncClient, api_url: str) -> str:
    """Log in as the service account and return a Bearer token."""
    response = await client.post(
        f"{api_url}/auth/login",
        data={"username": WORKER_USERNAME, "password": WORKER_PASSWORD},
    )
    response.raise_for_status()
    return response.json()["access_token"]


async def fetch_applications(client: httpx.AsyncClient, api_url: str, token: str) -> list[dict]:
    """Fetch all applications from the API with retry on transient errors."""
    headers = {"Authorization": f"Bearer {token}"}
    for attempt in range(MAX_RETRIES):
        try:
            response = await client.get(f"{api_url}/applications", headers=headers)
            response.raise_for_status()
            return response.json()
        except (httpx.HTTPError, httpx.TransportError):
            if attempt == MAX_RETRIES - 1:
                raise
            await asyncio.sleep(0.5 * (attempt + 1))
    return []


async def process_application(
    app: dict,
    redis: aioredis.Redis,
    semaphore: asyncio.Semaphore,
) -> dict | None:
    """
    Check one application.

    Returns a result dict, or None if the application was already processed
    in a previous run today (Redis idempotency key still set).
    """
    redis_key = f"{REDIS_KEY_PREFIX}{app['id']}"

    async with semaphore:
        if await redis.exists(redis_key):
            return None

        result = {
            "id": app["id"],
            "company": app["company"],
            "position": app["position"],
            "status": app["status"],
            "stale": is_stale(app),
        }

        await redis.setex(redis_key, REDIS_TTL, "1")
        return result


async def run_refresh(
    api_url: str = API_URL,
    redis_url: str = REDIS_URL,
) -> list[dict]:
    """Run the full refresh cycle and return the list of processed results."""
    redis = aioredis.from_url(redis_url)
    semaphore = asyncio.Semaphore(CONCURRENCY)

    try:
        async with httpx.AsyncClient() as client:
            token = await get_token(client, api_url)
            applications = await fetch_applications(client, api_url, token)

        tasks = [process_application(app, redis, semaphore) for app in applications]
        raw = await asyncio.gather(*tasks)
    finally:
        await redis.aclose()

    results = [r for r in raw if r is not None]
    stale = [r for r in results if r["stale"]]

    print(f"Refreshed {len(results)} applications. {len(stale)} stale.")
    for app in stale:
        print(f"  ! [{app['status']}] {app['position']} at {app['company']} (id={app['id']})")

    return results


if __name__ == "__main__":
    asyncio.run(run_refresh())
