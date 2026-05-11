"""Tests for AMB-015 — networking-session cutoff enforcement.

The bingo round is bounded by `events.cutoff_at`. After that timestamp
the FE may still attempt to send an interaction (clock drift, slow
network, race), so the server is the source of truth and must refuse
to record new interactions.
"""
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest

from api.bingo.bingo_interaction.services import CreateBingoInteraction


def _make_session(event):
    """Build a minimal async-session double for the service to use.

    We only need `get(Event, id)` to resolve the event row and a
    `rollback()` because the service's outer try/except may call it.
    The cutoff check fires before any other session access, so no other
    methods need to be stubbed.
    """
    return SimpleNamespace(
        get=AsyncMock(return_value=event),
        rollback=AsyncMock(),
    )


@pytest.mark.asyncio
async def test_rejects_interaction_after_cutoff(monkeypatch):
    """If cutoff_at is in the past, the service returns ok=False
    without touching boards or interactions."""

    past_cutoff = datetime.now(timezone.utc) - timedelta(minutes=1)
    event = SimpleNamespace(id=42, slug="ev-42", cutoff_at=past_cutoff)
    session = _make_session(event)

    async def fake_resolve(self, _slug):
        return event.id

    monkeypatch.setattr(
        CreateBingoInteraction, "_resolve_event_id", fake_resolve
    )

    service = CreateBingoInteraction(session)
    result = await service.execute(
        word_id_list="kw1,kw2",
        send_user_id=1,
        receive_user_id=2,
        event_slug="ev-42",
    )

    assert result.ok is False
    assert "종료" in (result.message or "")
    # No board lookup / interaction insert happened.
    session.get.assert_awaited_once()


@pytest.mark.asyncio
async def test_allows_interaction_before_cutoff(monkeypatch):
    """If cutoff_at is in the future, the cutoff guard does NOT
    short-circuit. The downstream board logic is mocked to fail
    loudly so we can confirm execution proceeded past the guard."""

    future_cutoff = datetime.now(timezone.utc) + timedelta(minutes=10)
    event = SimpleNamespace(id=43, slug="ev-43", cutoff_at=future_cutoff)
    session = _make_session(event)

    async def fake_resolve(self, _slug):
        return event.id

    monkeypatch.setattr(
        CreateBingoInteraction, "_resolve_event_id", fake_resolve
    )

    # Force a sentinel error from the very next step so we don't need
    # to mock the entire board pipeline. The service catches Exception
    # and returns the message — we assert on it.
    async def fake_execute(_stmt):
        raise RuntimeError("past-cutoff-guard")

    monkeypatch.setattr(session, "execute", fake_execute, raising=False)

    service = CreateBingoInteraction(session)
    result = await service.execute(
        word_id_list="kw1,kw2",
        send_user_id=1,
        receive_user_id=2,
        event_slug="ev-43",
    )

    assert result.ok is False
    assert "past-cutoff-guard" in (result.message or "")


@pytest.mark.asyncio
async def test_passes_when_cutoff_is_null(monkeypatch):
    """Legacy events without a cutoff_at should not be blocked — the
    column is nullable for backward compatibility."""

    event = SimpleNamespace(id=44, slug="ev-44", cutoff_at=None)
    session = _make_session(event)

    async def fake_resolve(self, _slug):
        return event.id

    monkeypatch.setattr(
        CreateBingoInteraction, "_resolve_event_id", fake_resolve
    )

    async def fake_execute(_stmt):
        raise RuntimeError("no-cutoff-passthrough")

    monkeypatch.setattr(session, "execute", fake_execute, raising=False)

    service = CreateBingoInteraction(session)
    result = await service.execute(
        word_id_list="kw1,kw2",
        send_user_id=1,
        receive_user_id=2,
        event_slug="ev-44",
    )

    assert result.ok is False
    assert "no-cutoff-passthrough" in (result.message or "")
