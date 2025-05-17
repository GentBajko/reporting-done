from io import StringIO
import csv
from typing import List, Optional
from datetime import datetime

from ulid import ULID
from loguru import logger
from fastapi import (
    Form,
    Query,
    Depends,
    Request,
    Response,
    APIRouter,
    HTTPException,
)
from fastapi.responses import HTMLResponse, StreamingResponse

from backend.models import LogCreateModel, LogResponseModel
from core.models.log import Log
from database.models import (
    Task,
    log_mapper,  # noqa F401
)
from core.models.user import User
from backend.dependencies import get_session
from backend.views.log_view import (
    get_log,
    create_log,
    update_log,
    upsert_log,
    get_all_logs,
)
from backend.utils.templates import templates
from backend.views.user_view import get_user_logs
from backend.dependencies.auth import (
    is_admin,
    get_current_user,
)
from backend.models.pagination import Pagination
from database.interfaces.session import ISession
from backend.utils.filters_and_sort import get_filters, get_sorting
from database.interfaces.repository import Repository

log_router = APIRouter(prefix="/log")


@log_router.get("/create", response_class=HTMLResponse)
def get_log_home(
    request: Request,
    task_id: Optional[str] = Query(None),
    task_name: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
):
    return templates.TemplateResponse(
        "log/create.html",
        {"request": request, "task_id": task_id, "task_name": task_name},
    )


@log_router.post("/", response_model=LogResponseModel)
async def create_log_endpoint(
    request: Request,
    task_id: str = Form(...),
    description: str = Form(...),
    hours_spent_today: float = Form(...),
    task_status: str = Form(...),
    session: ISession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    log_id = str(ULID())
    log_data = LogCreateModel(
        id=log_id,
        task_id=task_id,
        task_name="",
        description=description,
        hours_spent_today=hours_spent_today,
        task_status=task_status,
        user_id=current_user.id,
        user_name=current_user.full_name,
        timestamp=int(datetime.now().timestamp()),
    )
    try:
        created_log_model = create_log(log_data, session)
    except ValueError as ve:
        logger.warning(f"Value error creating log: {ve}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.exception(f"Error creating log: {e}")
        raise HTTPException(
            status_code=500, detail="Internal server error creating log"
        )
    return created_log_model


@log_router.get("/export", response_class=StreamingResponse)
def export_tasks_csv(
    request: Request,
    combined_filters: Optional[str] = Query(None),
    session: ISession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Export tasks between two dates as a CSV file.
    """
    if not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Access forbidden")
    try:
        filter_mapping = {
            "Date": "timestamp",
            "Task Name": "task_name",
            "Hours Worked": "hours_spent_today",
            "User": "user_name",
            "Description": "description",
            "Task Status": "task_status",
        }
        pagination = Pagination(limit=None, current_page=1, order_by=[])
        filters = get_filters(
            combined_filters,
            filter_mapping,
            "Task Name",
            date_fields=["Date"],
        )

        logs, _ = get_all_logs(
            session,
            pagination,
            **filters,
        )
        csv_file = StringIO()
        writer = csv.writer(csv_file)
        writer.writerow(
            [
                "ID",
                "Task Name",
                "User",
                "Task Status",
                "Hours Spent",
                "Date",
            ]
        )
        for log in logs:
            writer.writerow(
                [
                    log.id,
                    log.task_name,
                    log.user_name,
                    log.task_status,
                    log.hours_spent_today,
                    datetime.fromtimestamp(log.timestamp).strftime(
                        "%Y-%m-%d %H:%M:%S"
                    ),
                ]
            )
        csv_file.seek(0)
        response = StreamingResponse(
            iter([csv_file.getvalue()]),
            media_type="text/csv",
        )
        response.headers["Content-Disposition"] = (
            "attachment; filename=logs.csv"
        )
        return response
    except Exception as e:
        logger.exception(e)
        raise HTTPException(status_code=500, detail="Error exporting tasks")


@log_router.get("/{log_id}", response_class=HTMLResponse)
def get_log_endpoint(
    request: Request,
    log_id: str,
    session: ISession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    try:
        log = get_log(session, id=log_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))
    return templates.TemplateResponse(
        "log/detail.html", {"request": request, "log": log}
    )


@log_router.get("/{log_id}/edit", response_model=LogResponseModel)
def update_project_page(
    Request: Request,
    log_id: str,
    session: ISession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    log = get_log(session, id=log_id)

    if not log:
        raise HTTPException(status_code=404, detail="Log not found")

    return templates.TemplateResponse(
        "log/edit.html",
        {
            "log": log,
            "request": Request,
            "current_time": datetime.now().timestamp(),
        },
    )


@log_router.put("/{log_id}", response_model=LogResponseModel)
async def update_log_endpoint(
    request: Request,
    log_id: str,
    task_id: str = Form(...),
    task_name: str = Form(...),
    description: str = Form(...),
    hours_spent_today: float = Form(...),
    task_status: str = Form(...),
    session: ISession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    # Authorization: Admin or log owner can update
    with session as s:  # Added with session to fetch log for auth check
        log_repo = Repository(s, Log)
        log_to_update_check = log_repo.get(id=log_id)
        if not log_to_update_check:
            raise HTTPException(
                status_code=404, detail="Log not found for authorization check"
            )

        if (
            not is_admin(current_user)
            and log_to_update_check.user_id != current_user.id
        ):
            raise HTTPException(
                status_code=403, detail="Not authorized to update this log"
            )

    # The LogCreateModel submitted will have user_id and user_name from current_user (set in controller)
    # So, a non-admin cannot change the owner of the log via this update endpoint's current structure.
    # If task_id is changed, that's a different concern - the current LogCreateModel structure in PUT requires it.

    log_update_data = LogCreateModel(
        id=log_id,  # id is part of the path, but LogCreateModel requires it.
        user_id=current_user.id,
        user_name=current_user.full_name,
        task_name=task_name,
        description=description,
        hours_spent_today=hours_spent_today,
        task_status=task_status,
        task_id=task_id,
    )

    updated_log_model = update_log(log_id, log_update_data, session)
    return updated_log_model


@log_router.post("/upsert", response_model=LogResponseModel)
def upsert_log_endpoint(
    log: LogResponseModel, session: ISession = Depends(get_session)
):
    try:
        log = upsert_log(log, session)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return log


@log_router.get("/", response_model=List[LogResponseModel])
def get_all_logs_endpoint(
    request: Request,
    page: int = Query(1, alias="page"),
    sort: Optional[str] = Query("Date", alias="sort"),
    order: Optional[str] = Query("desc", alias="order"),
    limit: int = Query(15, alias="limit"),
    combined_filters: Optional[str] = Query(None, alias="filters"),
    session: ISession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    sort_mapping = {
        "ID": Log.id,
        "Task Name": Log.task_name,
        "Hours": Log.hours_spent_today,
        "Task Status": Log.task_status,
        "Date": Log.timestamp,
    }

    order_by = get_sorting(sort, order, sort_mapping)
    pagination = Pagination(limit=limit, current_page=page, order_by=order_by)

    filter_mapping = {
        "Date": "timestamp",
        "Task Name": "task_name",
        "Hours Worked": "hours_spent_today",
        "User": "user_name",
        "Description": "description",
        "Task Status": "task_status",
    }

    filters = get_filters(
        combined_filters, filter_mapping, "Task Name", date_fields=["Date"]
    )

    if is_admin(current_user):
        logs, pagination = get_all_logs(session, pagination, **filters)
    else:
        user_specific_filters = {**filters}
        user_specific_filters["user_id"] = current_user.id
        logs, _ = get_user_logs(
            session, current_user.id, pagination, **user_specific_filters
        )

    table_headers = [
        "Task Name",
        "User",
        "Hours Worked",
        "Description",
        "Date",
        "Task Status",
        "Actions",
    ]

    return templates.TemplateResponse(
        "log/logs.html",
        {
            "request": request,
            "headers": table_headers,
            "data": logs,
            "pagination": pagination,
            "entity": "log",
            "current_sort": sort,
            "current_order": order,
            "allowed_filter_fields": [
                "Task Name",
                "User",
                "Hours Worked",
                "Description",
                "Task Status",
            ],
        },
    )


@log_router.delete("/{log_id}", status_code=204)
async def delete_log_endpoint(
    log_id: str,
    session: ISession = Depends(get_session),
    current_user: User = Depends(get_current_user),
    # csrf_protect = Depends(validate_csrf) # If forms are used for DELETE
):
    try:
        log_to_delete_response = get_log(session, id=log_id)
    except ValueError:  # Assuming get_log raises ValueError if not found
        raise HTTPException(status_code=404, detail="Log not found")

    if (
        not is_admin(current_user)
        and log_to_delete_response.user_id != current_user.id
    ):
        raise HTTPException(
            status_code=403, detail="Not authorized to delete this log"
        )

    # At this point, log_to_delete_response is a LogResponseModel.
    # We need the actual DB object to delete via repository.
    # The log_view.py doesn't have a specific delete_log function yet.
    # So, directly using the repository here:
    with session as s:
        repo = Repository(s, Log)
        db_log_obj = repo.get(id=log_id)  # Fetch the ORM model instance
        if db_log_obj:
            # Consider implications: does deleting a log affect task hours_worked?
            # Current create_log in view_layer adds to task.hours_worked.
            # Deleting should probably subtract, or this logic should be in a service layer.
            # For now, simple deletion.
            task_repo = Repository(s, Task)
            task = task_repo.get(id=db_log_obj.task_id)
            if task:
                task.hours_worked -= db_log_obj.hours_spent_today
                if task.hours_worked < 0:
                    task.hours_worked = 0  # Prevent negative hours
                # Potentially re-evaluate task status if it was 'Done' due to this log.
                task_repo.update(task)

            repo.delete(db_log_obj)
            s.commit()
        else:
            # This case should ideally not be reached if get_log found it earlier
            raise HTTPException(
                status_code=404, detail="Log not found for deletion"
            )

    return Response(status_code=204)  # No content
