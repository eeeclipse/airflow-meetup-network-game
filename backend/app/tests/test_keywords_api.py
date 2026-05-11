"""Tests for AMB-018 — organizer keyword pool editor endpoints.

The endpoints operate directly on `events.keywords` jsonb (a list
of label strings) per the schema decision recorded in the plan
addendum. There is no separate `keywords_pool` table.
"""
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest
from fastapi import HTTPException

from api.events.routes import (
    add_event_keyword,
    delete_event_keyword,
    events_router,
    list_event_keywords,
)


def _session_with_event(event):
    """Helper: build an async-session double with a single event row."""
    return SimpleNamespace(
        get=AsyncMock(return_value=event),
        commit=AsyncMock(),
    )


@pytest.mark.asyncio
async def test_list_event_keywords_returns_jsonb_array():
    event = SimpleNamespace(id=3, keywords=["DAG", "XCom"])
    session = _session_with_event(event)
    result = await list_event_keywords(3, session)
    assert result == ["DAG", "XCom"]


@pytest.mark.asyncio
async def test_list_event_keywords_returns_empty_when_unset():
    event = SimpleNamespace(id=3, keywords=None)
    session = _session_with_event(event)
    result = await list_event_keywords(3, session)
    assert result == []


@pytest.mark.asyncio
async def test_list_event_keywords_404_when_event_missing():
    session = SimpleNamespace(get=AsyncMock(return_value=None))
    with pytest.raises(HTTPException) as exc:
        await list_event_keywords(99, session)
    assert exc.value.status_code == 404


@pytest.mark.asyncio
async def test_add_event_keyword_appends_to_list():
    event = SimpleNamespace(id=3, keywords=["DAG"])
    session = _session_with_event(event)
    body = SimpleNamespace(keyword="XCom")
    result = await add_event_keyword(3, body, session)
    assert result["keyword"] == "XCom"
    assert event.keywords == ["DAG", "XCom"]
    session.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_add_event_keyword_is_idempotent():
    event = SimpleNamespace(id=3, keywords=["DAG", "XCom"])
    session = _session_with_event(event)
    body = SimpleNamespace(keyword="DAG")
    result = await add_event_keyword(3, body, session)
    assert result["keyword"] == "DAG"
    assert event.keywords == ["DAG", "XCom"]
    # No commit when there's nothing to write.
    session.commit.assert_not_called()


@pytest.mark.asyncio
async def test_add_event_keyword_404_when_event_missing():
    session = SimpleNamespace(get=AsyncMock(return_value=None))
    body = SimpleNamespace(keyword="DAG")
    with pytest.raises(HTTPException) as exc:
        await add_event_keyword(99, body, session)
    assert exc.value.status_code == 404


@pytest.mark.asyncio
async def test_delete_event_keyword_removes_label():
    event = SimpleNamespace(id=3, keywords=["DAG", "XCom", "SLA"])
    session = _session_with_event(event)
    await delete_event_keyword(3, "XCom", session)
    assert event.keywords == ["DAG", "SLA"]
    session.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_delete_event_keyword_404_when_event_missing():
    session = SimpleNamespace(get=AsyncMock(return_value=None))
    with pytest.raises(HTTPException) as exc:
        await delete_event_keyword(99, "DAG", session)
    assert exc.value.status_code == 404


@pytest.mark.asyncio
async def test_delete_event_keyword_silent_when_label_absent():
    event = SimpleNamespace(id=3, keywords=["DAG"])
    session = _session_with_event(event)
    await delete_event_keyword(3, "Missing", session)
    assert event.keywords == ["DAG"]
    session.commit.assert_not_called()


def test_keyword_endpoints_registered_on_events_router():
    paths = {route.path for route in events_router.routes}
    assert "/events/{event_id}/keywords" in paths
    assert "/events/{event_id}/keywords/{keyword}" in paths
