from fastapi import Query, Depends, APIRouter, HTTPException
from loguru import logger

from core.models.user import User
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
