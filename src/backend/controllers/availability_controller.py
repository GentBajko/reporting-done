import json
from typing import Set, Dict, List, Union, Optional
import calendar  # Standard library, keep as is
from datetime import date, datetime, timedelta

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
from fastapi.responses import (  # HTMLResponse might not be needed if all templates are gone
    HTMLResponse,
    JSONResponse,
    RedirectResponse,
)

# backend.views.availability_view will be the new name
from backend.views import availability_view
from backend.models import (
    UserCalendarResponseModel,  # This might need to become UserAvailabilityResponseModel if it exists or is defined elsewhere
    DailyAvailabilityResponseModel,
)
from database.models import (
    user_mapper,  # noqa F401
    availability_mapper,  # Renamed from calendar_mapper
)
from core.models.user import User
from backend.dependencies import get_session
from database.models.mapper import mapper_registry  # noqa F401

# from backend.utils.templates import templates # Templates removed for this controller
from backend.dependencies.auth import (
    is_admin,
    get_current_user,
)
from backend.utils.xlsx_parser import FileParser, IFileParser
from database.interfaces.session import ISession
from core.models.office_availability import (
    OfficeAvailability,  # Renamed from OfficeCalendar
)

availability_router = APIRouter(
    prefix="/availability"
)  # Renamed router and prefix

attendance_data_store: Dict[
    str, Set[str]
] = {}  # This seems generic, might not need renaming


@availability_router.post("/upload_xlsx", response_class=RedirectResponse)
async def upload_xlsx(
    file: UploadFile = File(...),
    parser: IFileParser = Depends(FileParser),
    current_user: User = Depends(get_current_user),
    session: ISession = Depends(get_session),
):
    """
    Accepts an XLSX file upload, extracts attendance data in-memory, and updates the database.
    If the user dates match, sets OfficeAvailability.present to True.
    """
    if not is_admin(current_user):
        return RedirectResponse(
            url=f"/availability/{current_user.id}",
            status_code=302,  # Updated redirect
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
            user_record = (
                Repository(session, User)
                .filter(User.full_name == full_name)
                .first()
            )
            if user_record:
                office_availability_record = (
                    Repository(session, OfficeAvailability)
                    .filter(
                        OfficeAvailability.day == day_date,
                        OfficeAvailability.user_id == user_record.id,
                    )
                    .first()
                )
                if not office_availability_record:
                    office_availability_record = OfficeAvailability(
                        user_id=user_record.id,
                        day=day_date,
                        present=True,
                    )
                    session.add(office_availability_record)
                else:
                    office_availability_record.present = True
    session.commit()

    return RedirectResponse(
        url="/availability", status_code=302
    )  # Updated redirect


# @availability_router.get("/", response_class=HTMLResponse, response_model=None)
# def get_all_remote(
#     request: Request,
#     year: Optional[int] = Query(None, description="Year for the calendar"),
#     month: Optional[int] = Query(None, description="Month for the calendar"),
#     session: ISession = Depends(get_session),
#     current_user: User = Depends(get_current_user),
# ) -> Union[HTMLResponse, RedirectResponse]:
#     """
#     Returns a calendar view displaying days, highlighting users' presence with color coding.
#     This route used a template that has been removed. Commenting out for now.
#     It might need to be re-implemented to return JSON for the React frontend.
#     """
#     if not is_admin(current_user):
#         return RedirectResponse(
#             url=f"/availability/{current_user.id}", status_code=302 # Updated redirect
#         )

#     today = date.today()
#     used_year = year if year else today.year
#     used_month = month if month else today.month

#     if not 1 <= used_month <= 12:
#         raise HTTPException(status_code=400, detail="Invalid month value")

#     first_day = date(used_year, used_month, 1)
#     last_day = date(
#         used_year, used_month, calendar.monthrange(used_year, used_month)[1]
#     )

#     all_users: List[User] = session.query(User)
#     remote_days: List[OfficeAvailability] = session.query( # Renamed model
#         OfficeAvailability, # Renamed model
#         day__gte=first_day,
#         day__lte=last_day,
#     )

#     user_dict: Dict[str, str] = {user.id: user.full_name for user in all_users}

#     presence_by_date: Dict[date, Dict[str, bool]] = {}
#     for rd in remote_days:
#         if rd.day not in presence_by_date:
#             presence_by_date[rd.day] = {}  # type: ignore
#         user_full_name = user_dict.get(rd.user_id, "Unknown User")
#         presence_by_date[rd.day][user_full_name] = rd.present  # type: ignore

#     days_list = []
#     cal = calendar.Calendar()
#     for day_date in cal.itermonthdates(used_year, used_month):
#         if day_date.month != used_month:
#             continue
#         date_key = day_date.isoformat()
#         user_presence_map = presence_by_date.get(day_date, {})
#         color_coded_users = []
#         for user_full_name, present_val in user_presence_map.items():
#             color_class = "text-green-500" if present_val else "text-red-500" # This class was for HTML
#             color_coded_users.append(
#                 {"name": user_full_name, "color_class": color_class} # "color_class" might not be relevant for JSON API
#             )
#         day_obj = {
#             "day_number": day_date.day,
#             "day_name": day_date.strftime("%A"),
#             "date_iso": date_key,
#             "users": color_coded_users,
#             "is_weekend": day_date.weekday() >= 5,
#         }
#         days_list.append(day_obj)

#     month_name = datetime(used_year, used_month, 1).strftime("%B")

#     # return templates.TemplateResponse( # Template is removed
#     #     "calendar/all.html",
#     #     {
#     #         "request": request,
#     #         "days": days_list,
#     #         "current_month_name": month_name,
#     #         "current_month": used_month,
#     #         "current_year": used_year,
#     #     },
#     # )
#     # This endpoint needs to be re-evaluated: return JSON or remove.
#     # For now, raising a 501 Not Implemented or just keeping it commented.
#     raise HTTPException(status_code=501, detail="Not Implemented: HTML view removed.")


# Response model for user-specific availability GET
# Keeping UserAvailabilityResponse as is, assuming it's a generic structure.
# If UserCalendarResponseModel is used by new frontend, it might need review.
class UserAvailabilityResponse(BaseModel):
    selected_dates: List[str]  # List of "YYYY-MM-DD"
    year: int
    month: int


@availability_router.get("/{user_id}", response_model=UserAvailabilityResponse)
def get_user_availability(  # Renamed function
    request: Request,
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

    user_office_availabilities: List[OfficeAvailability] = Repository(
        session, OfficeAvailability
    ).query(
        OfficeAvailability.user_id == user_id,
        OfficeAvailability.day >= first_day,
        OfficeAvailability.day <= last_day,
    )

    # Filter for present days and format them
    selected_dates_result = [
        avail.day.isoformat()
        for avail in user_office_availabilities
        if avail.present
    ]

    # The original code had a potential issue: if a user had an entry for a day with present=False,
    # it wouldn't be included. The new frontend might expect all explicitly set "remote" (present=False) days too.
    # For now, sticking to `present=True` as per original logic for selected_dates.
    # The React frontend should clarify how it handles "present: false" vs "no entry".

    return UserAvailabilityResponse(
        selected_dates=selected_dates_result, year=used_year, month=used_month
    )


class PostUserAvailabilityResponse(BaseModel):
    message: str
    user_id: str
    year: int
    month: int
    selected_dates_count: int


@availability_router.post(
    "/{user_id}", response_model=PostUserAvailabilityResponse
)  # This route might conflict if another POST /{user_id} exists with different signature
def post_user_availability(  # Renamed function
    request: Request,
    user_id: str,
    selected_dates_json: str = Form(..., alias="selected_dates"),
    year: Optional[int] = Query(None),  # year and month from query for context
    month: Optional[int] = Query(
        None
    ),  # year and month from query for context
    session: ISession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if current_user.id != user_id and not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Access forbidden")

    today = date.today()
    used_year = year if year else today.year
    used_month = month if month else today.month

    if not (1 <= used_month <= 12):
        raise HTTPException(
            status_code=400, detail="Invalid month value for context"
        )

    try:
        selected_dates_list = json.loads(selected_dates_json)
        if not isinstance(selected_dates_list, list):
            raise ValueError("JSON was not a list")
        parsed_dates: Set[date] = set()
        for date_str in selected_dates_list:
            if not isinstance(date_str, str):
                raise ValueError("Date string is not a string")
            dt = datetime.strptime(date_str, "%Y-%m-%d").date()
            if dt.year != used_year or dt.month != used_month:
                raise ValueError(
                    f"Date {date_str} not in specified month/year {used_year}-{used_month:02d}"
                )
            parsed_dates.add(dt)

    except (json.JSONDecodeError, ValueError) as e:
        raise HTTPException(
            status_code=400, detail=f"Invalid JSON or date format: {e}"
        )

    first_day_of_month = date(used_year, used_month, 1)
    last_day_of_month = date(
        used_year, used_month, calendar.monthrange(used_year, used_month)[1]
    )

    # Fetch existing availability for the user for the month
    existing_availabilities: List[OfficeAvailability] = Repository(
        session, OfficeAvailability
    ).query(
        OfficeAvailability.user_id == user_id,
        OfficeAvailability.day >= first_day_of_month,
        OfficeAvailability.day <= last_day_of_month,
    )

    existing_avail_map: Dict[date, OfficeAvailability] = {
        avail.day: avail for avail in existing_availabilities
    }

    # Process selected dates: update existing or create new
    for day_to_set_present in parsed_dates:
        if day_to_set_present in existing_avail_map:
            existing_avail_map[day_to_set_present].present = True
        else:
            new_availability = OfficeAvailability(
                user_id=user_id, day=day_to_set_present, present=True
            )
            session.add(new_availability)
            existing_avail_map[day_to_set_present] = (
                new_availability  # Add to map to track
            )

    # Process dates in the month not selected: set to present=False if they exist
    current_day = first_day_of_month
    while current_day <= last_day_of_month:
        if (
            current_day not in parsed_dates
        ):  # If it wasn't in the selected list
            if current_day in existing_avail_map:  # And an entry exists
                existing_avail_map[
                    current_day
                ].present = False  # Mark as not present
            # If no entry exists and it wasn't selected, we do nothing (implicitly not present)
            # Or, based on frontend needs, create an entry with present=False
            # For now, only updating existing ones to False if they are not in selected_dates_list.
        current_day += timedelta(days=1)

    session.commit()

    return PostUserAvailabilityResponse(
        message="User availability updated successfully.",
        user_id=user_id,
        year=used_year,
        month=used_month,
        selected_dates_count=len(parsed_dates),
    )


class UpdateAvailabilityRequest(BaseModel):
    date: str  # YYYY-MM-DD
    status: str  # e.g., "Office", "Remote", "Off" - "present" (true/false) is more direct
    # Let's assume "status" means "present" if "Office", "not present" otherwise for now
    # This needs clarification based on React app's actual values.
    # For now, I'll map "Office" to present=True, others to present=False.


class BatchUpdateAvailabilityRequest(BaseModel):
    office_dates: List[str] = Field(
        default_factory=list,
        description="List of YYYY-MM-DD dates for office presence",
    )
    # What about dates explicitly set to remote/not present?
    # This model seems to only handle setting dates to "present".
    # The React frontend might send a more comprehensive payload.
    # The previous `post_user_availability` handled this by taking a list of "present" dates
    # and setting others in the month to "not present". This new batch seems less complete.
    # I will assume office_dates means present=True for these dates.


@availability_router.post(
    "/{user_id}/day", response_model=DailyAvailabilityResponseModel
)  # This route seems redundant if POST /{user_id} can handle individual day states
async def update_user_availability_for_day_endpoint(
    user_id: str,
    payload: UpdateAvailabilityRequest,
    session: ISession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if current_user.id != user_id and not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Access forbidden")

    try:
        target_date = datetime.strptime(payload.date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(
            status_code=400, detail="Invalid date format. Use YYYY-MM-DD."
        )

    # Mapping status to boolean `present`
    # This mapping needs to be confirmed with frontend capabilities
    is_present = payload.status.lower() == "office"

    availability_record = (
        Repository(session, OfficeAvailability)
        .filter(
            OfficeAvailability.user_id == user_id,
            OfficeAvailability.day == target_date,
        )
        .first()
    )

    if availability_record:
        availability_record.present = is_present
    else:
        availability_record = OfficeAvailability(
            user_id=user_id, day=target_date, present=is_present
        )
        session.add(availability_record)

    session.commit()

    return DailyAvailabilityResponseModel(
        user_id=user_id,
        date=target_date.isoformat(),
        # The DailyAvailabilityResponseModel needs to be checked. What does it expect?
        # Assuming it expects a 'status' string or a 'present' boolean.
        # Let's assume it expects 'present' for now.
        present=is_present,
    )


# The UserCalendarResponseModel was used by the original get_user_calendar_data_endpoint.
# If the React app uses a similar structure, this model might still be relevant.
# The new GET /{user_id} returns UserAvailabilityResponse, which is simpler.
# This might indicate that UserCalendarResponseModel is deprecated or used elsewhere.
# The POST route below also uses UserCalendarResponseModel.
@availability_router.post(
    "/{user_id}/batch_update",
    response_model=UserCalendarResponseModel,  # Changed route to avoid conflict
)
async def update_user_availability_for_month_endpoint(  # Renamed function for clarity
    user_id: str,
    year: int = Query(...),
    month: int = Query(..., ge=1, le=12),
    payload: BatchUpdateAvailabilityRequest = Body(
        ...
    ),  # This payload only has office_dates
    session: ISession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if current_user.id != user_id and not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Access forbidden")

    # This endpoint only receives 'office_dates'. How are 'non-office' dates handled?
    # Option 1: Only update specified dates to 'present=True'. Other dates remain untouched.
    # Option 2: All dates in the month NOT in office_dates are set to 'present=False'.
    # The original `post_user_remote` (now `post_user_availability`) implemented Option 2.
    # This batch update should probably align.
    # For now, implementing Option 2: dates in payload are present=True, others in month are present=False.

    parsed_office_dates: Set[date] = set()
    for date_str in payload.office_dates:
        try:
            parsed_office_dates.add(
                datetime.strptime(date_str, "%Y-%m-%d").date()
            )
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid date format in office_dates: {date_str}",
            )

    first_day_of_month = date(year, month, 1)
    last_day_of_month = date(year, month, calendar.monthrange(year, month)[1])

    # Fetch existing availabilities for the month
    existing_availabilities_list: List[OfficeAvailability] = Repository(
        session, OfficeAvailability
    ).query(
        OfficeAvailability.user_id == user_id,
        OfficeAvailability.day >= first_day_of_month,
        OfficeAvailability.day <= last_day_of_month,
    )
    existing_avail_map: Dict[date, OfficeAvailability] = {
        avail.day: avail for avail in existing_availabilities_list
    }

    # Iterate through all days of the month
    current_day = first_day_of_month
    updated_availabilities_for_response: Dict[str, bool] = {}

    while current_day <= last_day_of_month:
        is_present_for_day = current_day in parsed_office_dates

        if current_day in existing_avail_map:
            existing_avail_map[current_day].present = is_present_for_day
        else:
            new_availability = OfficeAvailability(
                user_id=user_id, day=current_day, present=is_present_for_day
            )
            session.add(new_availability)

        updated_availabilities_for_response[current_day.isoformat()] = (
            is_present_for_day
        )
        current_day += timedelta(days=1)

    session.commit()

    # UserCalendarResponseModel structure:
    # user_id: str
    # year: int
    # month: int
    # availability: Dict[str, bool]  # Date string -> present status

    return UserCalendarResponseModel(
        user_id=user_id,
        year=year,
        month=month,
        availability=updated_availabilities_for_response,
    )


# This GET route was previously named get_user_calendar_data_endpoint
# and also had a path /calendar/{user_id}
# The other GET /{user_id} (now get_user_availability) returns UserAvailabilityResponse.
# This one returns UserCalendarResponseModel.
# To avoid conflict, I'm changing the path. The React app will determine which one it needs.
# Or one of them is deprecated.
@availability_router.get(
    "/{user_id}/detailed", response_model=UserCalendarResponseModel
)
async def get_user_availability_detailed_endpoint(  # Renamed function
    user_id: str,
    year: int = Query(None),
    month: int = Query(None, ge=1, le=12),
    session: ISession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if current_user.id != user_id and not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Access forbidden")

    today = date.today()
    used_year = year if year else today.year
    used_month = month if month else today.month

    if not (
        1 <= used_month <= 12
    ):  # Should be caught by Query(ge=1, le=12) but good to have
        used_month = today.month  # Default to current month on invalid input
        if not year:  # if year was also none
            used_year = today.year

    first_day = date(used_year, used_month, 1)
    last_day = date(
        used_year, used_month, calendar.monthrange(used_year, used_month)[1]
    )

    user_availabilities: List[OfficeAvailability] = Repository(
        session, OfficeAvailability
    ).query(
        OfficeAvailability.user_id == user_id,
        OfficeAvailability.day >= first_day,
        OfficeAvailability.day <= last_day,
    )

    availability_map: Dict[str, bool] = {
        avail.day.isoformat(): avail.present for avail in user_availabilities
    }

    # To ensure all days of the month are present in the response, even if no record exists (implicit false)
    # This matches the likely expectation for a full calendar display.
    all_days_in_month_map: Dict[str, bool] = {}
    current_day_iter = first_day
    while current_day_iter <= last_day:
        date_iso = current_day_iter.isoformat()
        all_days_in_month_map[date_iso] = availability_map.get(
            date_iso, False
        )  # Default to False if no record
        current_day_iter += timedelta(days=1)

    return UserCalendarResponseModel(
        user_id=user_id,
        year=used_year,
        month=used_month,
        availability=all_days_in_month_map,
    )
