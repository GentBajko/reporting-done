from typing import Sequence
from datetime import date, datetime
import calendar

from fastapi import Query, Depends, APIRouter, HTTPException, Body
from pydantic import BaseModel, Field

from backend.services import AvailabilityService
from backend.types.dtos import AvailabilityDTO
from backend.types.result import Err
from backend.protocols.session import ISession
from backend.dependencies import (
    get_session,
    get_current_user,
    is_admin,
    get_availability_service,
)
from core.models.user import User
from core.models.office_availability import OfficeAvailability
from database.repositories.repository import Repository


new_calendar_router = APIRouter(prefix="/calendar")


class DailyAvailabilityResponse(BaseModel):
    date: str
    status: str
    day_of_week: int


class TaskResponse(BaseModel):
    id: str
    title: str
    description: str
    timestamp: int
    status: str | None = None


class UserCalendarResponse(BaseModel):
    user_id: str
    user_name: str
    year: int
    month: int
    availability: Sequence[DailyAvailabilityResponse]
    tasks: Sequence[TaskResponse]


class CalendarUpdateRequest(BaseModel):
    office_dates: Sequence[str]


class CalendarUpdateResponse(BaseModel):
    message: str
    user_id: str
    year: int
    month: int
    saved_office_days: int


@new_calendar_router.get("/{user_id}", response_model=UserCalendarResponse)
def get_user_calendar_endpoint(
    user_id: str,
    year: int = Query(..., ge=2000, le=2100),
    month: int = Query(..., ge=1, le=12),
    session: ISession = Depends(get_session),
    current_user: User = Depends(get_current_user),
    availability_service: AvailabilityService = Depends(get_availability_service),
):
    if current_user.id != user_id and not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Not authorized to view this calendar")
    
    result = availability_service.get_user_availability(user_id, year, month, session)
    
    if isinstance(result, Err):
        raise HTTPException(status_code=404, detail=result.error)
    
    dto = result.value
    
    from backend.services.task_service import TaskService
    from backend.dependencies.services import get_task_service
    from backend.types.pagination import PaginationParams
    
    task_service = get_task_service()
    tasks_result = task_service.list_for_user(
        user_id,
        PaginationParams(page=1, per_page=1000),
        session,
    )
    
    first_day_ts = int(datetime(year, month, 1).timestamp())
    last_day = calendar.monthrange(year, month)[1]
    last_day_ts = int(datetime(year, month, last_day, 23, 59, 59).timestamp())
    
    month_tasks = [
        t for t in tasks_result.items
        if first_day_ts <= t.timestamp <= last_day_ts
    ]
    
    return UserCalendarResponse(
        user_id=dto.user_id,
        user_name=dto.user_name,
        year=dto.year,
        month=dto.month,
        availability=[
            DailyAvailabilityResponse(
                date=a.date.isoformat(),
                status=a.status,
                day_of_week=a.day_of_week,
            )
            for a in dto.availability
        ],
        tasks=[
            TaskResponse(
                id=t.id,
                title=t.title,
                description=t.description,
                timestamp=t.timestamp,
                status=t.status,
            )
            for t in month_tasks
        ],
    )


@new_calendar_router.post("/{user_id}", response_model=CalendarUpdateResponse)
def update_user_calendar_endpoint(
    user_id: str,
    year: int = Query(..., ge=2000, le=2100),
    month: int = Query(..., ge=1, le=12),
    payload: CalendarUpdateRequest = Body(...),
    session: ISession = Depends(get_session),
    current_user: User = Depends(get_current_user),
    availability_service: AvailabilityService = Depends(get_availability_service),
):
    if current_user.id != user_id and not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Not authorized to update this calendar")
    
    try:
        office_dates = [datetime.strptime(d, "%Y-%m-%d").date() for d in payload.office_dates]
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid date format: {e}")
    
    for d in office_dates:
        if d.year != year or d.month != month:
            raise HTTPException(
                status_code=400,
                detail=f"Date {d} is not in {year}-{month:02d}",
            )
    
    result = availability_service.batch_update_month(user_id, year, month, office_dates, session)
    
    if isinstance(result, Err):
        raise HTTPException(status_code=400, detail=result.error)
    
    return CalendarUpdateResponse(
        message="Calendar updated successfully",
        user_id=user_id,
        year=year,
        month=month,
        saved_office_days=len(office_dates),
    )
