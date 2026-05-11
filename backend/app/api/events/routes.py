from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from core.db import AsyncSessionDepends
from models.event import Event, EventStatus
from models.event_manager_request import EventManagerRequest
from models.policy_template import PolicyTemplate

from .schema import (
    EventManagerRequestCreateItem,
    EventManagerRequestCreateRequest,
    EventManagerRequestCreateResponse,
    PublicEventPrivacyNoticeItem,
    PublicEventPrivacyNoticeResponse,
    PublicEventListResponse,
    PublicEventProfileItem,
    PublicEventProfileResponse,
    PublicPolicyTemplateItem,
    PublicPolicyTemplateResponse,
    PublicEventSummaryItem,
)


events_router = APIRouter(prefix="/events", tags=["events"])


def resolve_public_event_status(event: Event) -> str:
    if event.status == EventStatus.FINISHED:
        return "ended"
    if event.status == EventStatus.IN_PROGRESS:
        return "in_progress"
    return "scheduled"


@events_router.get(
    "",
    response_model=PublicEventListResponse,
    summary="공개 이벤트 목록 조회",
)
async def list_public_events(
    db: AsyncSessionDepends,
):
    events = await Event.get_all(db)
    event_items = [
        PublicEventSummaryItem(
            id=event.id,
            slug=event.slug,
            name=event.name,
            start_at=event.start_time,
            board_size=event.bingo_size,
            bingo_mission_count=event.success_condition,
            status=resolve_public_event_status(event),
        )
        for event in events
    ]

    return PublicEventListResponse(
        ok=True,
        message="이벤트 목록을 불러왔습니다.",
        events=event_items,
    )


@events_router.post(
    "/manager-requests",
    response_model=EventManagerRequestCreateResponse,
    summary="이벤트 관리자 권한 신청",
)
async def create_event_manager_request(
    payload: EventManagerRequestCreateRequest,
    db: AsyncSessionDepends,
):
    created_request = await EventManagerRequest.create(
        db,
        name=payload.name.strip(),
        email=payload.email.strip().lower(),
        organization=payload.organization.strip() if payload.organization else None,
        event_name=payload.event_name.strip(),
        event_purpose=payload.event_purpose.strip(),
        expected_event_date=payload.expected_event_date,
        expected_attendee_count=payload.expected_attendee_count,
        notes=payload.notes.strip() if payload.notes else None,
    )

    return EventManagerRequestCreateResponse(
        ok=True,
        message="이벤트 관리자 신청을 접수했습니다.",
        request=EventManagerRequestCreateItem(
            id=created_request.id,
            status=created_request.status.value,
            created_at=created_request.created_at,
        ),
    )


@events_router.get(
    "/privacy-template",
    response_model=PublicPolicyTemplateResponse,
    summary="공개 개인정보 처리 안내 조회",
)
@events_router.get(
    "/consent-template",
    response_model=PublicPolicyTemplateResponse,
    include_in_schema=False,
)
async def get_public_policy_template(
    db: AsyncSessionDepends,
):
    template = await PolicyTemplate.ensure_platform_policy_template(db)

    return PublicPolicyTemplateResponse(
        ok=True,
        message="공개 플랫폼 개인정보처리방침을 불러왔습니다.",
        template=PublicPolicyTemplateItem(
            content=PolicyTemplate.render_platform_policy_content(template.content_markdown),
            updated_at=template.updated_at,
        ),
    )


@events_router.get(
    "/{event_slug}/privacy-notice-template",
    response_model=PublicEventPrivacyNoticeResponse,
    summary="행사 참가자 개인정보 처리 안내 조회",
)
async def get_public_event_privacy_notice(
    event_slug: str,
    db: AsyncSessionDepends,
):
    event = await Event.get_by_slug(db, event_slug.strip().lower())
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="이벤트를 찾을 수 없습니다.",
        )

    template = await PolicyTemplate.ensure_consent_template(db)
    rendered_content = PolicyTemplate.render_participant_notice_content(
        template.content_markdown,
        event_name=event.name,
        event_team=event.event_team,
        event_contact_email=event.admin_email,
    )

    return PublicEventPrivacyNoticeResponse(
        ok=True,
        message="행사 참가자 개인정보 처리 안내를 불러왔습니다.",
        template=PublicEventPrivacyNoticeItem(
            event_slug=event.slug,
            event_name=event.name,
            event_team=event.event_team,
            contact_email=event.admin_email,
            content=rendered_content,
            updated_at=template.updated_at,
        ),
    )


@events_router.get(
    "/{event_slug}",
    response_model=PublicEventProfileResponse,
    summary="공개 이벤트 설정 조회",
)
async def get_public_event_profile(
    event_slug: str,
    db: AsyncSessionDepends,
):
    event = await Event.get_by_slug(db, event_slug.strip().lower())
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="이벤트를 찾을 수 없습니다.",
        )

    return PublicEventProfileResponse(
        ok=True,
        message="이벤트 설정을 불러왔습니다.",
        event=PublicEventProfileItem(
            id=event.id,
            slug=event.slug,
            name=event.name,
            location=event.location,
            event_team=event.event_team,
            start_at=event.start_time,
            end_at=event.end_time,
            board_size=event.bingo_size,
            bingo_mission_count=event.success_condition,
            keywords=[str(keyword) for keyword in (event.keywords or [])],
        ),
    )


# AMB-015 — server-canonical cutoff for the FE countdown hook.
# The FE polls this endpoint once at mount, computes `driftMs = serverNow
# - clientNow`, then ticks against `cutoff_at` using the drift-adjusted
# clock so an inaccurate device clock still renders the right remaining
# time. The endpoint is intentionally tiny so a 50-VU smoke (AMB-020)
# can hammer it cheaply.
@events_router.get("/{event_id}/cutoff")
async def get_event_cutoff(event_id: int, session: AsyncSessionDepends):
    event = await session.get(Event, event_id)
    if event is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    return {
        "now": datetime.now(timezone.utc).isoformat(),
        "cutoff_at": event.cutoff_at.isoformat() if event.cutoff_at else None,
    }


# AMB-018 — organizer keyword pool editor.
#
# Operates directly on `events.keywords` jsonb (a list of label
# strings) per the plan addendum — no separate keywords_pool
# table. Per spec §5.1 the FE applies new keywords only to boards
# generated AFTER the addition; existing boards are frozen.
#
# Auth is intentionally light (a FE PIN gate) — the meetup is a
# one-shot 50-person event and the worst case of an outsider
# editing the pool is mid-game confusion. Flagged in the AMB-018
# ticket if this project ever ships beyond the meetup.


class KeywordIn(BaseModel):
    keyword: str = Field(..., min_length=1, max_length=120)


@events_router.get("/{event_id}/keywords")
async def list_event_keywords(
    event_id: int, session: AsyncSessionDepends
) -> list[str]:
    event = await session.get(Event, event_id)
    if event is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    return list(event.keywords or [])


@events_router.post("/{event_id}/keywords", status_code=status.HTTP_201_CREATED)
async def add_event_keyword(
    event_id: int,
    body: KeywordIn,
    session: AsyncSessionDepends,
):
    event = await session.get(Event, event_id)
    if event is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    keyword = body.keyword.strip()
    current = list(event.keywords or [])
    if keyword in current:
        # Idempotent — same label twice does not mutate.
        return {"keyword": keyword, "added": False}
    current.append(keyword)
    # Reassign so SQLAlchemy detects the change on the jsonb column.
    event.keywords = current
    await session.commit()
    return {"keyword": keyword, "added": True}


@events_router.delete(
    "/{event_id}/keywords/{keyword}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_event_keyword(
    event_id: int,
    keyword: str,
    session: AsyncSessionDepends,
):
    event = await session.get(Event, event_id)
    if event is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    current = list(event.keywords or [])
    if keyword not in current:
        # No-op for unknown labels — easier client behavior.
        return None
    event.keywords = [k for k in current if k != keyword]
    await session.commit()
    return None
