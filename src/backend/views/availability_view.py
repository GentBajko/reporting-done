from typing import Set, Dict, List, Optional
import calendar
from datetime import date, timedelta

from sqlalchemy.orm import joinedload

from backend.models import (
    TaskResponseModel,
    UserCalendarResponseModel,  # Assuming this structure is still relevant for availability
    DailyAvailabilityResponseModel,
)
from core.models.task import Task
from core.models.user import User
from database.interfaces.session import ISession
from database.interfaces.repository import Repository
from core.models.office_availability import (
    OfficeAvailability,  # Changed import
)


def get_user_availability_data(
    session: ISession, user_id: str, year: int, month: int
) -> UserCalendarResponseModel:  # Function renamed
    user_repo = Repository(session, User)
    user = user_repo.get(id=user_id)
    if not user:
        raise ValueError(f"User with id {user_id} not found")

    start_date = date(year, month, 1)
    num_days_in_month = calendar.monthrange(year, month)[1]
    end_date = date(year, month, num_days_in_month)

    # Query OfficeAvailability records
    office_availability_repo = Repository(session, OfficeAvailability)
    availability_entries: List[OfficeAvailability] = (
        office_availability_repo.query(
            user_id=user_id,
            # Assuming 'day' is the field name in OfficeAvailability for the date
            # and the query method supports __gte and __lte for date fields.
            # Based on controller, it should be `day__gte` and `day__lte` if using SQLAlchemy-like filters.
            # For a generic Repository, it might be `day_gte` or a filter dict.
            # Let's assume the repository can handle `day__gte` and `day__lte` or similar for date range.
            # If using a simple dict like `day=value` in repo, this needs specific range query support.
            # The controller used `day__gte`, so let's align if this repo supports it.
            # For now, assuming a more direct attribute if not __gte style on generic repo.
            # This needs to match the actual implementation of Repository.query()
            # Reverting to a simpler filter for now if __gte isn't standard for this Repository.
            # Let's assume the query can take a list of conditions or the controller's usage implies
            # the Repository is more sophisticated.
            # For now, will fetch all for user and filter in Python, though less efficient.
            # A better way is to ensure Repository supports range queries on dates.
            # Given controller uses `day__gte`, assume this repo supports it too.
        )
        .filter(
            OfficeAvailability.user_id == user_id,
            OfficeAvailability.day >= start_date,
            OfficeAvailability.day <= end_date,
        )
        .all()
    )

    # Map dates to their 'present' status
    presence_map: Dict[date, bool] = {
        entry.day: entry.present for entry in availability_entries
    }

    daily_availability_models: List[DailyAvailabilityResponseModel] = []
    current_day = start_date
    while current_day <= end_date:
        is_present = presence_map.get(
            current_day, False
        )  # Default to False if no entry
        status_str = ""
        if current_day.weekday() >= 5:  # Saturday or Sunday
            status_str = "Off"
        elif is_present:
            status_str = "Office"
        else:
            status_str = "Remote"  # Weekday, not present

        daily_availability_models.append(
            DailyAvailabilityResponseModel(
                date=current_day.isoformat(),
                status=status_str,
                day_of_week=current_day.weekday(),
            )
        )
        current_day += timedelta(days=1)

    task_repo = Repository(session, Task)
    user_tasks_orm = (
        task_repo.query(user_id=user_id)
        .options(joinedload(Task.project))
        .all()
    )
    task_response_models: List[TaskResponseModel] = []
    for task_orm in user_tasks_orm:
        task_response_models.append(
            TaskResponseModel.model_validate(
                task_orm.to_dict(exclude_relations=["logs"])
            )
        )

    return UserCalendarResponseModel(  # This response model might need to be updated if its definition changes
        user_id=user.id,
        user_name=user.full_name,
        year=year,
        month=month,
        availability=daily_availability_models,  # Changed field name from calendar to availability if applicable in model def
        tasks=task_response_models,
    )


def update_single_day_availability(
    session: ISession,
    user_id: str,
    day_str: str,  # "YYYY-MM-DD"
    status: str,  # Expected: "Office", "Remote", "Off"
) -> DailyAvailabilityResponseModel:
    user_repo = Repository(session, User)
    user = user_repo.get(id=user_id)
    if not user:
        raise ValueError(f"User with id {user_id} not found")

    try:
        target_date = date.fromisoformat(day_str)
    except ValueError:
        raise ValueError(f"Invalid date format: {day_str}. Use YYYY-MM-DD.")

    is_present: bool
    # Determine `is_present` based on `status` and weekend rules
    if target_date.weekday() >= 5:  # Weekend
        if status.lower() not in ["off", ""]:
            raise ValueError(
                f"Cannot set active work status ({status}) for a weekend day: {day_str}. Only 'Off' is allowed."
            )
        is_present = (
            False  # Weekends are generally not "present" in office terms
        )
    else:  # Weekday
        if status.lower() == "office":
            is_present = True
        elif status.lower() == "remote":
            is_present = False
        elif status.lower() == "off":  # Explicitly setting weekday to Off
            is_present = False  # Could also imply deletion of record or special handling
        else:
            raise ValueError(
                f"Invalid status: {status}. Must be 'Office', 'Remote', or 'Off'."
            )

    office_availability_repo = Repository(session, OfficeAvailability)
    # Assuming Repository.get() can fetch by multiple conditions or a composite key if day is part of it.
    # Or, more typically, query for it.
    # Let's assume a get by user_id and day is possible, or adapt to query().first().
    # The controller uses session.query(Model, day=day_date, user_id=user_id[0].id).first() for this.
    # So the Repository should ideally support similar. If not, use a filter.
    availability_entry: Optional[OfficeAvailability] = (
        office_availability_repo.filter(
            OfficeAvailability.user_id == user_id,
            OfficeAvailability.day == target_date,
        ).first()
    )

    final_status_str = status  # Default to input status for response

    if target_date.weekday() >= 5:
        final_status_str = "Off"
        # For weekends, if status is 'Off', we might not need a record or ensure 'present' is False.
        # If an entry exists and status is 'Off', update its 'present' to False or delete it.
        # If no entry, and status is 'Off', do nothing or create one with 'present=False'.
        # Current logic: sets is_present = False for weekends.
        if availability_entry:
            availability_entry.present = False
        else:
            # Optionally create an entry for 'Off' weekend day if desired by frontend
            # availability_entry = OfficeAvailability(user_id=user_id, day=target_date, present=False)
            # office_availability_repo.add(availability_entry)
            pass  # No record, no action for 'Off' weekend if not creating explicit 'Off' records

    else:  # Weekday
        if availability_entry:
            availability_entry.present = is_present
        else:
            availability_entry = OfficeAvailability(
                user_id=user_id, day=target_date, present=is_present
            )
            office_availability_repo.add(availability_entry)

        # Update final_status_str based on actual is_present for weekdays
        if is_present:
            final_status_str = "Office"
        else:
            final_status_str = "Remote"  # Or "Off" if status was "Off"
            if status.lower() == "off":
                final_status_str = "Off"

    session.commit()
    # If no entry was found or created (e.g. setting weekend to 'Off' without creating a record),
    # then availability_entry might be None. The response model needs valid data.
    if (
        not availability_entry
        and target_date.weekday() >= 5
        and status.lower() == "off"
    ):
        # Simulate entry for response if none was made for an 'Off' weekend
        response_date = target_date
        response_status = "Off"
    elif availability_entry:
        response_date = availability_entry.day
        response_status = final_status_str
    else:  # Should not happen if we always create/update for weekdays
        raise Exception(
            "Availability entry not found or created unexpectedly."
        )

    return DailyAvailabilityResponseModel(
        date=response_date.isoformat(),
        status=response_status,
        day_of_week=response_date.weekday(),
    )


def batch_update_monthly_availability(
    session: ISession,
    user_id: str,
    year: int,
    month: int,
    office_dates: List[str],  # List of "YYYY-MM-DD" strings for "Office" days
) -> UserCalendarResponseModel:
    user_repo = Repository(session, User)
    user = user_repo.get(id=user_id)
    if not user:
        raise ValueError(f"User with id {user_id} not found")

    office_availability_repo = Repository(session, OfficeAvailability)
    parsed_office_dates: Set[date] = {
        date.fromisoformat(d_str) for d_str in office_dates
    }

    start_date = date(year, month, 1)
    num_days_in_month = calendar.monthrange(year, month)[1]
    end_date = date(year, month, num_days_in_month)

    # Fetch existing entries for the month to update them
    existing_entries_list: List[OfficeAvailability] = (
        office_availability_repo.filter(
            OfficeAvailability.user_id == user_id,
            OfficeAvailability.day >= start_date,
            OfficeAvailability.day <= end_date,
        ).all()
    )

    existing_entries_map: Dict[date, OfficeAvailability] = {
        e.day: e for e in existing_entries_list
    }

    current_processing_day = start_date
    while current_processing_day <= end_date:
        if (
            current_processing_day.weekday() >= 5
        ):  # Skip weekends for this auto-logic
            # Optionally ensure weekends are marked 'present=False' or removed if they exist
            if current_processing_day in existing_entries_map:
                existing_entries_map[current_processing_day].present = False
            current_processing_day += timedelta(days=1)
            continue

        is_present_for_day = current_processing_day in parsed_office_dates

        entry = existing_entries_map.get(current_processing_day)
        if entry:
            entry.present = is_present_for_day
        else:
            new_entry = OfficeAvailability(
                user_id=user_id,
                day=current_processing_day,
                present=is_present_for_day,
            )
            office_availability_repo.add(new_entry)

        current_processing_day += timedelta(days=1)

    session.commit()

    return get_user_availability_data(session, user_id, year, month)
