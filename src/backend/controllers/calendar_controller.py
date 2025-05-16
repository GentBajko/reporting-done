import json
from typing import Set, Dict, List, Union, Optional
import calendar
from datetime import date, datetime

from fastapi import (
    Body,
    File,
    Form,
    Query,
    Depends,
    Request,
    APIRouter,
    UploadFile,
    HTTPException,
)
from pydantic import Field, BaseModel
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse

from backend.views import calendar_view
from backend.models import (
    UserCalendarResponseModel,
    DailyAvailabilityResponseModel,
)
from database.models import (
    user_mapper,  # noqa F401
    calendar_mapper,  # noqa F401
)
from core.models.user import User
from backend.dependencies import get_session
from database.models.mapper import mapper_registry  # noqa F401
from backend.utils.templates import templates
from backend.dependencies.auth import (
    is_admin,
    get_current_user,
)
from backend.utils.xlsx_parser import FileParser, IFileParser
from core.models.office_calendar import OfficeCalendar
from database.interfaces.session import ISession

calendar_router = APIRouter(prefix="/calendar")

attendance_data_store: Dict[str, Set[str]] = {}


@calendar_router.post("/upload_xlsx", response_class=RedirectResponse)
async def upload_xlsx(
    file: UploadFile = File(...),
    parser: IFileParser = Depends(FileParser),
    current_user: User = Depends(get_current_user),
    session: ISession = Depends(get_session),
):
    """
    Accepts an XLSX file upload, extracts attendance data in-memory, and updates the database.
    If the user dates match, sets OfficeCalendar.present to True.
    """
    if not is_admin(current_user):
        return RedirectResponse(
            url=f"/calendar/{current_user.id}", status_code=302
        )

    file_ext = file.filename.split(".")[-1] if file.filename else ""
    file_content = await file.read()
    data = parser.parse_bytes(file_content, file_ext)

    for day_key, names in data.items():
        try:
            day_date = datetime.strptime(day_key, "%Y-%m-%d").date()
        except ValueError:
            continue
        for full_name in names:
            user_record = session.query(User, full_name=full_name)
            if user_record:
                office_calendar = (
                    session.query(
                        OfficeCalendar, day=day_date, user_id=user_record[0].id
                    )  # noqa E501
                )
                if not office_calendar:
                    office_calendar = OfficeCalendar(
                        user_id=user_record[0].id, day=day_date, present=True
                    )
                    session.add(office_calendar)
                else:
                    office_calendar[0].present = True
    session.commit()

    return RedirectResponse(url="/calendar", status_code=302)


@calendar_router.get("/", response_class=HTMLResponse, response_model=None)
def get_all_remote(
    request: Request,
    year: Optional[int] = Query(None, description="Year for the calendar"),
    month: Optional[int] = Query(None, description="Month for the calendar"),
    session: ISession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Union[HTMLResponse, RedirectResponse]:
    """
    Returns a calendar view displaying days, highlighting users' presence with color coding.
    """
    if not is_admin(current_user):
        return RedirectResponse(
            url=f"/calendar/{current_user.id}", status_code=302
        )

    today = date.today()
    used_year = year if year else today.year
    used_month = month if month else today.month

    if not 1 <= used_month <= 12:
        raise HTTPException(status_code=400, detail="Invalid month value")

    first_day = date(used_year, used_month, 1)
    last_day = date(
        used_year, used_month, calendar.monthrange(used_year, used_month)[1]
    )

    all_users: List[User] = session.query(User)
    remote_days: List[OfficeCalendar] = session.query(
        OfficeCalendar,
        day__gte=first_day,
        day__lte=last_day,
    )

    user_dict: Dict[str, str] = {user.id: user.full_name for user in all_users}

    presence_by_date: Dict[date, Dict[str, bool]] = {}
    for rd in remote_days:
        if rd.day not in presence_by_date:
            presence_by_date[rd.day] = {}  # type: ignore
        user_full_name = user_dict.get(rd.user_id, "Unknown User")
        presence_by_date[rd.day][user_full_name] = rd.present  # type: ignore

    days_list = []
    cal = calendar.Calendar()
    for day_date in cal.itermonthdates(used_year, used_month):
        if day_date.month != used_month:
            continue
        date_key = day_date.isoformat()
        user_presence_map = presence_by_date.get(day_date, {})
        color_coded_users = []
        for user_full_name, present_val in user_presence_map.items():
            color_class = "text-green-500" if present_val else "text-red-500"
            color_coded_users.append(
                {"name": user_full_name, "color_class": color_class}
            )
        day_obj = {
            "day_number": day_date.day,
            "day_name": day_date.strftime("%A"),
            "date_iso": date_key,
            "users": color_coded_users,
            "is_weekend": day_date.weekday() >= 5,
        }
        days_list.append(day_obj)

    month_name = datetime(used_year, used_month, 1).strftime("%B")

    return templates.TemplateResponse(
        "calendar/all.html",
        {
            "request": request,
            "days": days_list,
            "current_month_name": month_name,
            "current_month": used_month,
            "current_year": used_year,
        },
    )


# Response model for user-specific availability GET
class UserAvailabilityResponse(BaseModel):
    selected_dates: List[str]  # List of "YYYY-MM-DD"
    year: int
    month: int


@calendar_router.get(
    "/{user_id}", response_model=UserAvailabilityResponse
)  # Changed to JSON response
def get_user_remote(
    request: Request,  # request is not used, can be removed if not needed for other reasons
    user_id: str,
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    session: ISession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if current_user.id != user_id and not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Access forbidden")

    today = date.today()
    used_year = year if year else today.year
    used_month = month if month else today.month

    if not (1 <= used_month <= 12):
        raise HTTPException(status_code=400, detail="Invalid month value")

    first_day = date(used_year, used_month, 1)
    last_day = date(
        used_year, used_month, calendar.monthrange(used_year, used_month)[1]
    )

    office_calendar_entries: List[OfficeCalendar] = session.query(
        OfficeCalendar,
        user_id=user_id,
        day__gte=first_day,
        day__lte=last_day,
        present=True,  # Assuming we only care about days marked as present/office days
    )

    selected_date_strings = [
        entry.day.isoformat() for entry in office_calendar_entries
    ]

    return UserAvailabilityResponse(
        selected_dates=selected_date_strings, year=used_year, month=used_month
    )


# Response model for POST user availability
class PostUserAvailabilityResponse(BaseModel):
    message: str
    user_id: str
    year: int
    month: int
    selected_dates_count: int


@calendar_router.post(
    "/{user_id}", response_model=PostUserAvailabilityResponse
)  # Changed to JSON response
def post_user_remote(
    request: Request,  # request is not used
    user_id: str,
    selected_dates_json: str = Form(
        ..., alias="selected_dates"
    ),  # Expecting a JSON string in a form field
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    session: ISession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if current_user.id != user_id and not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Access forbidden")

    try:
        selected_date_strings = json.loads(selected_dates_json)
        if not isinstance(selected_date_strings, list):
            raise ValueError("selected_dates must be a list.")

        selected_date_objects = set()
        for d_str in selected_date_strings:
            if not isinstance(d_str, str):
                raise ValueError(
                    "All dates in selected_dates list must be strings."
                )
            selected_date_objects.add(
                datetime.strptime(d_str, "%Y-%m-%d").date()
            )

    except (json.JSONDecodeError, ValueError) as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid date format or structure in selected_dates: {str(e)}",
        )

    today = date.today()
    used_year = year if year is not None else today.year
    used_month = month if month is not None else today.month

    if not (1 <= used_month <= 12):
        # This check should ideally use the resolved used_month/year if they were None initially
        # but the Query params directly are checked here. For now, assume client sends them if non-current month.
        pass  # Or raise error if year/month are strictly required with selected_dates

    first_day_of_month = date(used_year, used_month, 1)
    last_day_of_month = date(
        used_year, used_month, calendar.monthrange(used_year, used_month)[1]
    )

    # Fetch existing office days for the user in the given month/year that are marked as present
    existing_office_days: List[OfficeCalendar] = session.query(
        OfficeCalendar,
        user_id=user_id,
        day__gte=first_day_of_month,
        day__lte=last_day_of_month,
        present=True,  # We are managing office days (present=True)
    )
    existing_dates_set = {oc.day for oc in existing_office_days}

    dates_to_add_as_office = selected_date_objects - existing_dates_set
    dates_to_remove_from_office = (
        existing_dates_set - selected_date_objects
    )  # These were office, now are not

    # Add new office days (mark as present=True)
    for day_to_add in dates_to_add_as_office:
        # Ensure the day is within the target month (client should ensure this, but good to double check)
        if first_day_of_month <= day_to_add <= last_day_of_month:
            # Check if a record for this day (present=False or no record) exists
            existing_record_for_day = session.query(
                OfficeCalendar, user_id=user_id, day=day_to_add
            )
            if existing_record_for_day:
                existing_record_for_day[0].present = True
            else:
                new_office_day = OfficeCalendar(
                    user_id=user_id, day=day_to_add, present=True
                )
                session.add(new_office_day)

    # For days that were office days but are no longer in selected_dates, mark them as not present (present=False)
    # Or delete them if present=False means "not an office day" and we don't store explicit False records for this use case.
    # The original code deleted records if dates_to_remove matched. Here, we manage 'present' flag.
    # If OfficeCalendar is only for marking *presence*, then we might delete records not in selected_date_objects.
    # Let's assume we mark as present=False for days no longer selected as office days.
    # However, the user sends their *selected office days*. So, any existing OfficeCalendar entry for this user/month
    # that is NOT in selected_date_objects should be marked present=False or deleted.

    for day_to_make_not_office in dates_to_remove_from_office:
        # This only affects days that were previously office days (present=True)
        # Find the specific OfficeCalendar record to update its `present` status
        record_to_update_list = [
            oc
            for oc in existing_office_days
            if oc.day == day_to_make_not_office
        ]
        if record_to_update_list:
            record_to_update = record_to_update_list[0]
            # For user availability, if a day is unselected, it means they are NOT in office.
            # So we should mark `present = False`.
            # Admin users might have different rules for editing past dates vs user editing own future dates.
            # The original `post_user_remote` had logic for admin not removing past dates unless admin.
            # For now, let's simplify: if it was an office day and is not selected anymore, it's not an office day.
            if not is_admin(current_user) and record_to_update.day < today:
                # Non-admin trying to change a past date, skip this change.
                continue
            record_to_update.present = False  # Mark as not an office day

    session.commit()

    return PostUserAvailabilityResponse(
        message="User availability updated successfully.",
        user_id=user_id,
        year=used_year,
        month=used_month,
        selected_dates_count=len(selected_date_objects),
    )


# Request model for updating a single day's availability
class UpdateAvailabilityRequest(BaseModel):
    date: str  # YYYY-MM-DD
    status: str  # e.g., "Office", "Remote", "Off"


# New request model for batch updating a month's office days
class BatchUpdateAvailabilityRequest(BaseModel):
    office_dates: List[str] = Field(
        default_factory=list
    )  # List of "YYYY-MM-DD" for office days


# Keep the old endpoint for single day updates if it's still used elsewhere or for future use
@calendar_router.post(
    "/{user_id}/day", response_model=DailyAvailabilityResponseModel
)
async def update_user_availability_for_day_endpoint(
    user_id: str,
    payload: UpdateAvailabilityRequest,
    session: ISession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if not is_admin(current_user) and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    try:
        updated_day = calendar_view.update_single_day_availability(
            session,
            user_id,
            payload.date,
            payload.status,
        )
        return updated_day
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(
            f"Error updating availability for user {user_id}, date {payload.date}: {e}"
        )
        raise HTTPException(
            status_code=500, detail="Error updating availability"
        )


# New endpoint for batch updating a month's availability based on office days
@calendar_router.post(
    "/{user_id}", response_model=UserCalendarResponseModel
)  # Or a simpler success response
async def update_user_availability_for_month_endpoint(
    user_id: str,
    year: int = Query(...),
    month: int = Query(..., ge=1, le=12),
    payload: BatchUpdateAvailabilityRequest = Body(...),
    session: ISession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if not is_admin(current_user) and current_user.id != user_id:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to update this user's availability",
        )

    try:
        # This view function will handle setting office_dates to "Office"
        # and other weekdays to "Remote" for the given month.
        updated_calendar_data = (
            calendar_view.batch_update_monthly_availability(
                session=session,
                user_id=user_id,
                year=year,
                month=month,
                office_dates=payload.office_dates,
            )
        )
        # Return the full updated month data, or just a success message
        return updated_calendar_data  # Assuming the view function returns UserCalendarResponseModel
    except ValueError as e:
        logger.warning(
            f"Value error during batch update for user {user_id}, {year}-{month}: {e}"
        )
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception(
            f"Error batch updating availability for user {user_id}, {year}-{month}: {e}"
        )
        raise HTTPException(
            status_code=500, detail="Error batch updating availability"
        )


# This is the GET endpoint that needs to be corrected.
# It should call calendar_view.get_user_calendar_data and return UserCalendarResponseModel.
@calendar_router.get("/{user_id}", response_model=UserCalendarResponseModel)
async def get_user_calendar_data_endpoint(  # Renamed for clarity, was get_user_remote
    user_id: str,
    year: int = Query(
        None
    ),  # Made year/month optional, view will use current if None
    month: int = Query(None, ge=1, le=12),
    session: ISession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if not is_admin(current_user) and current_user.id != user_id:
        # Allow admin to see anyone's calendar, user to see their own
        raise HTTPException(
            status_code=403, detail="Not authorized to view this calendar data"
        )

    today = date.today()
    target_year = year if year is not None else today.year
    target_month = month if month is not None else today.month

    if not (1 <= target_month <= 12):
        raise HTTPException(status_code=400, detail="Invalid month value")

    try:
        calendar_data = calendar_view.get_user_calendar_data(
            session=session,
            user_id=user_id,
            year=target_year,
            month=target_month,
        )
        if not calendar_data.availability and not calendar_data.tasks:
            # Consider if 404 is appropriate if user exists but has no data for month
            # For now, returning empty lists is fine as per model.
            pass
        return calendar_data
    except ValueError as e:  # Assuming get_user_calendar_data might raise ValueError for invalid user
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.exception(
            f"Error fetching calendar data for user {user_id}, {target_year}-{target_month}: {e}"
        )
        raise HTTPException(
            status_code=500, detail="Error fetching calendar data"
        )
