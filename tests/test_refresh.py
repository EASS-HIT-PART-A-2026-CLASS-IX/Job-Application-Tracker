import asyncio
from datetime import date, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

import pytest


from scripts.refresh import (
    REDIS_TTL,
    fetch_applications,
    is_stale,
    process_application,
    run_refresh,
)


def make_app(
    id=1,
    status="applied",
    applied_date=None,
    company="Acme",
    position="Engineer",
):
    return {
        "id": id,
        "company": company,
        "position": position,
        "status": status,
        "applied_date": applied_date,
    }


def old_date(days=20):
    return (date.today() - timedelta(days=days)).isoformat()


def recent_date(days=5):
    return (date.today() - timedelta(days=days)).isoformat()


# ── Pure unit tests (no async needed) ─────────────────────────────────────────

def test_is_stale_false_for_offer():
    assert is_stale(make_app(status="offer", applied_date=old_date())) is False


def test_is_stale_false_for_rejected():
    assert is_stale(make_app(status="rejected", applied_date=old_date())) is False


def test_is_stale_false_when_no_applied_date():
    assert is_stale(make_app(status="applied", applied_date=None)) is False


def test_is_stale_true_when_old_enough():
    assert is_stale(make_app(status="applied", applied_date=old_date(20))) is True


def test_is_stale_false_when_recent():
    assert is_stale(make_app(status="applied", applied_date=recent_date(5))) is False


def test_is_stale_boundary_just_under():
    boundary = (date.today() - timedelta(days=13)).isoformat()
    assert is_stale(make_app(status="applied", applied_date=boundary)) is False


def test_is_stale_boundary_exactly_at():
    boundary = (date.today() - timedelta(days=14)).isoformat()
    assert is_stale(make_app(status="applied", applied_date=boundary)) is True


# ── Async tests ────────────────────────────────────────────────────────────────

@pytest.mark.anyio
async def test_process_application_skips_already_processed():
    redis = AsyncMock()
    redis.exists = AsyncMock(return_value=1)
    semaphore = asyncio.Semaphore(5)

    result = await process_application(make_app(id=1), redis, semaphore)

    assert result is None
    redis.setex.assert_not_called()


@pytest.mark.anyio
async def test_process_application_processes_new_app():
    redis = AsyncMock()
    redis.exists = AsyncMock(return_value=0)
    semaphore = asyncio.Semaphore(5)

    result = await process_application(make_app(id=2, status="applied"), redis, semaphore)

    assert result is not None
    assert result["id"] == 2
    redis.setex.assert_called_once_with("refresh:processed:2", REDIS_TTL, "1")


@pytest.mark.anyio
async def test_process_application_flags_stale():
    redis = AsyncMock()
    redis.exists = AsyncMock(return_value=0)
    semaphore = asyncio.Semaphore(5)

    app = make_app(id=3, status="applied", applied_date=old_date(20))
    result = await process_application(app, redis, semaphore)

    assert result["stale"] is True


@pytest.mark.anyio
async def test_run_refresh_returns_processed_results():
    apps = [
        make_app(id=1, status="applied", applied_date=old_date(20)),
        make_app(id=2, status="offer", applied_date=old_date(20)),
    ]

    mock_redis = AsyncMock()
    mock_redis.exists = AsyncMock(return_value=0)
    mock_redis.aclose = AsyncMock()

    mock_response = MagicMock()
    mock_response.json.return_value = apps
    mock_response.raise_for_status = MagicMock()

    mock_client = AsyncMock()
    mock_client.get = AsyncMock(return_value=mock_response)

    with (
        patch("scripts.refresh.aioredis.from_url", return_value=mock_redis),
        patch("scripts.refresh.httpx.AsyncClient") as mock_cls,
    ):
        mock_cls.return_value.__aenter__ = AsyncMock(return_value=mock_client)
        mock_cls.return_value.__aexit__ = AsyncMock(return_value=None)

        results = await run_refresh(api_url="http://test", redis_url="redis://test")

    assert len(results) == 2
    stale = [r for r in results if r["stale"]]
    assert len(stale) == 1
    assert stale[0]["id"] == 1
