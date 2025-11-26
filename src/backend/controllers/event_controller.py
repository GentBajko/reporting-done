from typing import Sequence

from fastapi import Query, Depends, APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.services.event_service import EventService
from backend.services.pagination_service import PaginationService
from backend.types.dtos import EventDTO, EventCreateDTO, EventUpdateDTO
from backend.types.pagination import PaginationParams
from backend.types.result import Err
from backend.protocols.session import ISession
from backend.dependencies import (
    get_session,
    get_current_user,
    is_admin,
)
from core.models.user import User


event_router = APIRouter(prefix="/event")

_event_service = EventService(PaginationService())


class EventCreateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=1000)
    event_type: str = Field(min_length=1, max_length=50)
    event_date: str


class EventUpdateRequest(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=1000)
    event_type: str | None = Field(default=None, min_length=1, max_length=50)
    event_date: str | None = None


class PaginatedEventResponse(BaseModel):
    items: Sequence[EventDTO]
    total: int
    page: int
    per_page: int
    has_next: bool
    has_prev: bool


@event_router.post("/", response_model=EventDTO)
async def create_event_endpoint(
    body: EventCreateRequest,
    session: ISession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    dto = EventCreateDTO(
        title=body.title,
        description=body.description,
        event_type=body.event_type,
        event_date=body.event_date,
    )
    
    result = _event_service.create(dto, current_user.id, session)
    
    if isinstance(result, Err):
        raise HTTPException(status_code=400, detail=result.error)
    
    return result.value


@event_router.get("/", response_model=PaginatedEventResponse)
def get_all_events_endpoint(
    page: int = Query(1, ge=1),
    limit: int = Query(15, ge=1, le=100),
    event_type: str | None = Query(None),
    session: ISession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    pagination = PaginationParams(page=page, per_page=limit)
    
    filters = {}
    if event_type:
        filters["event_type"] = event_type
    
    if is_admin(current_user):
        result = _event_service.list_all(pagination, session, **filters)
    else:
        result = _event_service.list_for_user(current_user.id, pagination, session, **filters)
    
    return PaginatedEventResponse(
        items=result.items,
        total=result.total,
        page=result.page,
        per_page=result.meta.per_page,
        has_next=result.has_next,
        has_prev=result.has_prev,
    )


@event_router.get("/my", response_model=PaginatedEventResponse)
def get_my_events_endpoint(
    page: int = Query(1, ge=1),
    limit: int = Query(15, ge=1, le=100),
    year: int | None = Query(None, ge=2000, le=2100),
    month: int | None = Query(None, ge=1, le=12),
    session: ISession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    pagination = PaginationParams(page=page, per_page=limit)
    
    if year and month:
        events = _event_service.get_user_events_for_month(
            current_user.id, year, month, session
        )
        return PaginatedEventResponse(
            items=events,
            total=len(events),
            page=1,
            per_page=len(events) or 15,
            has_next=False,
            has_prev=False,
        )
    
    result = _event_service.list_for_user(current_user.id, pagination, session)
    
    return PaginatedEventResponse(
        items=result.items,
        total=result.total,
        page=result.page,
        per_page=result.meta.per_page,
        has_next=result.has_next,
        has_prev=result.has_prev,
    )


@event_router.get("/{event_id}", response_model=EventDTO)
def get_event_endpoint(
    event_id: str,
    session: ISession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    result = _event_service.get_by_id(event_id, session)
    
    if isinstance(result, Err):
        raise HTTPException(status_code=404, detail=result.error)
    
    event = result.value
    
    if not is_admin(current_user) and event.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this event")
    
    return event


@event_router.put("/{event_id}", response_model=EventDTO)
async def update_event_endpoint(
    event_id: str,
    body: EventUpdateRequest,
    session: ISession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    dto = EventUpdateDTO(
        title=body.title,
        description=body.description,
        event_type=body.event_type,
        event_date=body.event_date,
    )
    
    result = _event_service.update(
        event_id,
        dto,
        current_user.id,
        is_admin(current_user),
        session,
    )
    
    if isinstance(result, Err):
        raise HTTPException(status_code=400, detail=result.error)
    
    return result.value


@event_router.delete("/{event_id}", status_code=204)
async def delete_event_endpoint(
    event_id: str,
    session: ISession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    result = _event_service.delete(
        event_id,
        current_user.id,
        is_admin(current_user),
        session,
    )
    
    if isinstance(result, Err):
        raise HTTPException(status_code=400, detail=result.error)

