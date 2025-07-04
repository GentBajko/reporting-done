from fastapi import Query, Depends, APIRouter, HTTPException, Body
from loguru import logger
from pydantic import BaseModel
from typing import List
from datetime import datetime, date
import calendar

from core.models.user import User
from core.models.office_availability import OfficeAvailability
from backend.dependencies import get_session
from backend.dependencies.auth import is_admin, get_current_user
from database.interfaces.session import ISession
from backend.models.calendar_page import PydanticBackendUserCalendarResponse
from backend.views.new_calendar_view import get_new_calendar_data_for_user

new_calendar_router = APIRouter(prefix="/calendar")


@new_calendar_router.get(
    "/{user_id}",
    response_model=PydanticBackendUserCalendarResponse,
    summary="Get calendar data for a user by month",
)
def get_user_calendar_endpoint(
    user_id: str,
    year: int = Query(..., description="Year for the calendar data"),
    month: int = Query(
        ..., ge=1, le=12, description="Month for the calendar data (1-12)"
    ),
    session: ISession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if not (current_user.id == user_id or is_admin(current_user)):
        raise HTTPException(
            status_code=403,
            detail="Not authorized to view this user's calendar data",
        )

    try:
        calendar_data = get_new_calendar_data_for_user(
            session=session, user_id=user_id, year=year, month=month
        )
        return calendar_data
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error fetching calendar data: {e}")
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while fetching calendar data.",
        )


class CalendarUpdateRequest(BaseModel):
    office_dates: List[str]  # List of YYYY-MM-DD dates


class CalendarUpdateResponse(BaseModel):
    message: str
    user_id: str
    year: int
    month: int
    saved_office_days: int


@new_calendar_router.post(
    "/{user_id}",
    response_model=CalendarUpdateResponse,
    summary="Update calendar availability for a user"
)
def update_user_calendar_endpoint(
    user_id: str,
    year: int = Query(..., description="Year for the calendar data"),
    month: int = Query(..., ge=1, le=12, description="Month for the calendar data (1-12)"),
    payload: CalendarUpdateRequest = Body(...),
    session: ISession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if not (current_user.id == user_id or is_admin(current_user)):
        raise HTTPException(
            status_code=403,
            detail="Not authorized to update this user's calendar data",
        )
    
    try:
        # Parse and validate dates
        office_dates_set = set()
        for date_str in payload.office_dates:
            try:
                parsed_date = datetime.strptime(date_str, "%Y-%m-%d").date()
                # Verify date is in the correct month/year
                if parsed_date.year != year or parsed_date.month != month:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Date {date_str} is not in {year}-{month:02d}"
                    )
                office_dates_set.add(parsed_date)
            except ValueError:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid date format: {date_str}. Use YYYY-MM-DD."
                )
        
        # Get all days in the month
        first_day = date(year, month, 1)
        last_day = date(year, month, calendar.monthrange(year, month)[1])
        
        # Get existing availability records for the month
        existing_records = session.query(
            OfficeAvailability,
            user_id=user_id,
            day__gte=first_day,
            day__lte=last_day
        )
        
        existing_map = {record.day: record for record in existing_records}
        
        # Update or create records for all days in the month
        current_day = first_day
        while current_day <= last_day:
            is_office_day = current_day in office_dates_set
            
            if current_day in existing_map:
                # Update existing record
                existing_map[current_day].present = is_office_day
            else:
                # Create new record
                new_availability = OfficeAvailability(
                    user_id=user_id,
                    day=current_day,
                    present=is_office_day
                )
                session.add(new_availability)
            
            current_day = date(current_day.year, current_day.month, current_day.day + 1)
            if current_day.month != month:
                break
        
        session.commit()
        
        return CalendarUpdateResponse(
            message="Calendar updated successfully",
            user_id=user_id,
            year=year,
            month=month,
            saved_office_days=len(office_dates_set)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating calendar data: {e}")
        session.rollback()
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while updating calendar data."
        )
