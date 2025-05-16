from typing import Dict, List
import calendar
from datetime import date, datetime, timedelta  # Added datetime

from loguru import logger
from sqlalchemy.orm import joinedload

from backend.models import (
    TaskResponseModel,
    UserCalendarResponseModel,
    DailyAvailabilityResponseModel,
)
from core.models.task import Task
from core.models.user import User
from core.models.office_calendar import (
    CalendarDay,  # Assuming this is the correct model name for daily status
)
from database.interfaces.session import ISession
from database.interfaces.repository import Repository


def get_user_calendar_data(
    session: ISession, user_id: str, year: int, month: int
) -> UserCalendarResponseModel:
    user_repo = Repository(session, User)
    user = user_repo.get(id=user_id)
    if not user:
        raise ValueError(f"User with id {user_id} not found")

    start_date = date(year, month, 1)
    # Correctly calculate the last day of the month
    num_days_in_month = calendar.monthrange(year, month)[1]
    end_date = date(year, month, num_days_in_month)

    # Fetch CalendarDay entries for the user for the given month
    calendar_day_repo = Repository(session, CalendarDay)
    availability_entries = calendar_day_repo.query(
        user_id=user_id,
        date_gte=start_date,  # Assuming query method supports date_gte and date_lte
        date_lte=end_date,
    ).all()  # Use .all() or iterate if it returns a query object

    availability_map: Dict[str, str] = {
        entry.date.isoformat(): entry.status for entry in availability_entries
    }

    daily_availability_models: List[DailyAvailabilityResponseModel] = []
    current_day = start_date
    while current_day <= end_date:
        day_status = availability_map.get(
            current_day.isoformat(), "Remote"
        )  # Default to Remote if no entry
        # Weekday check: 0 is Monday, 6 is Sunday
        if current_day.weekday() >= 5:  # Saturday or Sunday
            day_status = "Off"  # Or whatever non-workday status is appropriate

        daily_availability_models.append(
            DailyAvailabilityResponseModel(
                date=current_day.isoformat(),
                status=day_status,
                day_of_week=current_day.weekday(),  # Monday is 0, Sunday is 6
            )
        )
        current_day += timedelta(days=1)

    # Fetch tasks for the user (example: tasks due in this month, or assigned tasks)
    # This part needs refinement based on how tasks should appear on the calendar
    task_repo = Repository(session, Task)
    user_tasks_orm = (
        task_repo.query(user_id=user_id)
        .options(joinedload(Task.project))
        .all()
    )
    task_response_models: List[TaskResponseModel] = []
    for task_orm in user_tasks_orm:
        # Filter tasks that are relevant for the current month view
        # For simplicity, showing all tasks. Actual logic might depend on task.due_date, etc.
        task_response_models.append(
            TaskResponseModel.model_validate(
                task_orm.to_dict(exclude_relations=["logs"])
            )
        )

    return UserCalendarResponseModel(
        user_id=user.id,
        user_name=user.full_name,
        year=year,
        month=month,
        availability=daily_availability_models,
        tasks=task_response_models,
    )


def update_single_day_availability(
    session: ISession,
    user_id: str,
    day_str: str,  # "YYYY-MM-DD"
    status: str,
) -> DailyAvailabilityResponseModel:
    user_repo = Repository(session, User)
    user = user_repo.get(id=user_id)
    if not user:
        raise ValueError(f"User with id {user_id} not found")

    try:
        target_date = date.fromisoformat(day_str)
    except ValueError:
        raise ValueError(f"Invalid date format: {day_str}. Use YYYY-MM-DD.")

    # Prevent updating weekends to work statuses if that's a business rule
    if target_date.weekday() >= 5 and status in ["Office", "Remote"]:
        raise ValueError(
            f"Cannot set work status ({status}) for a weekend day: {day_str}"
        )

    calendar_day_repo = Repository(session, CalendarDay)
    calendar_entry = calendar_day_repo.get(user_id=user_id, date=target_date)

    if calendar_entry:
        calendar_entry.status = status
    else:
        calendar_entry = CalendarDay(
            user_id=user_id, date=target_date, status=status
        )
        calendar_day_repo.add(calendar_entry)

    session.commit()
    # session.refresh(calendar_entry) # if needed, but we construct response manually

    return DailyAvailabilityResponseModel(
        date=calendar_entry.date.isoformat(),
        status=calendar_entry.status,
        day_of_week=calendar_entry.date.weekday(),
    )


def batch_update_monthly_availability(
    session: ISession,
    user_id: str,
    year: int,
    month: int,
    office_dates: List[str],  # List of "YYYY-MM-DD" strings
) -> UserCalendarResponseModel:
    user_repo = Repository(session, User)
    user = user_repo.get(id=user_id)
    if not user:
        raise ValueError(f"User with id {user_id} not found")

    calendar_day_repo = Repository(session, CalendarDay)
    office_dates_set = set(office_dates)

    num_days_in_month = calendar.monthrange(year, month)[1]

    for day_num in range(1, num_days_in_month + 1):
        current_processing_date = date(year, month, day_num)
        date_str = current_processing_date.isoformat()

        # Skip weekends for Office/Remote logic, unless an explicit status like "Off" can be set for them.
        # The frontend AvailabilityPage prevents clicking weekends for Office status.
        if current_processing_date.weekday() >= 5:  # 0=Monday, 6=Sunday
            # Optionally, ensure weekend days are marked "Off" or simply ignore them
            # calendar_entry = calendar_day_repo.get(user_id=user_id, date=current_processing_date)
            # if calendar_entry and calendar_entry.status not in ["Off", "Holiday"]:
            #    calendar_entry.status = "Off"
            # elif not calendar_entry:
            #    calendar_entry = CalendarDay(user_id=user_id, date=current_processing_date, status="Off")
            #    calendar_day_repo.add(calendar_entry)
            continue  # For now, skip auto-setting status for weekends

        new_status = ""
        if date_str in office_dates_set:
            new_status = "Office"
        else:
            new_status = "Remote"  # Default for weekdays not in office_dates

        calendar_entry = calendar_day_repo.get(
            user_id=user_id, date=current_processing_date
        )
        if calendar_entry:
            if calendar_entry.status != new_status:
                calendar_entry.status = new_status
        else:
            calendar_entry = CalendarDay(
                user_id=user_id,
                date=current_processing_date,
                status=new_status,
            )
            calendar_day_repo.add(calendar_entry)

    session.commit()

    # After updating, return the new state of the month's calendar for the user
    return get_user_calendar_data(session, user_id, year, month)


# Placeholder for get_all_calendar_events (admin view)
# def get_all_calendar_events(session: ISession, year: int, month: int) -> List[UserCalendarResponseModel]:
#    all_users = Repository(session, User).query().all()
#    all_events: List[UserCalendarResponseModel] = []
#    for user in all_users:
#        all_events.append(get_user_calendar_data(session, user.id, year, month))
#    return all_events
