from io import StringIO
import csv
from typing import List, Optional
from datetime import datetime

from loguru import logger
from fastapi import Form, Query, Depends, Request, APIRouter, HTTPException, Response
from fastapi.responses import HTMLResponse, StreamingResponse

from backend.models import TaskCreateModel, TaskResponseModel
from core.models.log import Log
from database.models import task_mapper  # noqa F401
from core.models.task import Task
from core.models.user import User
from backend.dependencies import get_session
from backend.utils.templates import templates
from backend.views.task_view import (
    get_task,
    create_task,
    update_task,
    upsert_task,
    get_all_tasks,
    get_task_logs,
    get_user_tasks,
    get_project_tasks,
)
from backend.dependencies.auth import (
    is_admin,
    get_current_user,
)
from backend.models.pagination import Pagination
from database.interfaces.session import ISession
from backend.utils.filters_and_sort import get_filters, get_sorting
from database.repositories.repository import Repository

task_router = APIRouter(prefix="/task")


@task_router.get("/create")
def get_task_home(
    request: Request, current_user: User = Depends(get_current_user)
):
    """
    Endpoint to retrieve the task home page.
    """
    return templates.TemplateResponse("task/create.html", {"request": request})


@task_router.post("/", response_model=TaskResponseModel)
async def create_task_endpoint(
    request: Request,
    project_id: str = Form(...),
    title: str = Form(...),
    hours_required: float = Form(...),
    description: str = Form(...),
    user_id: Optional[str] = Form(None),
    status: Optional[str] = Form(None),
    session: ISession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    final_user_id = current_user.id
    if user_id and is_admin(current_user):
        final_user_id = user_id
    elif user_id and not is_admin(current_user):
        if user_id != current_user.id:
            pass

    task_data = TaskCreateModel(
        project_id=project_id,
        project_name="",
        user_id=final_user_id,
        user_name="",
        title=title,
        hours_required=hours_required,
        description=description,
        status=status,
    )
    try:
        created_task_model = create_task(task_data, session)
    except ValueError as ve:
        logger.warning(f"Value error creating task: {ve}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.exception(f"Error creating task: {e}")
        raise HTTPException(
            status_code=500, detail="Internal server error creating task"
        )
    return created_task_model


@task_router.get("/options", response_class=HTMLResponse)
def get_project_options(
    request: Request,
    session: ISession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    pagination = Pagination(
        limit=300,
        current_page=1,
        order_by=[Task.timestamp],  # type: ignore
    )
    tasks = (
        get_all_tasks(session, pagination)[0]
        if is_admin(current_user)
        else [
            project
            for project in get_user_tasks(
                session, current_user.id, pagination
            )[0]
        ]
    )

    options_html = ""
    for task in tasks:
        options_html += f'<option value="{task.id}" status="{task.status}">{task.title}</option>'

    return HTMLResponse(content=options_html)


@task_router.get("/export", response_class=StreamingResponse)
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
            "Title": "title",
            "Project": "project_name",
            "Hours Required": "hours_required",
            "Hours Worked": "hours_worked",
            "Status": "status",
            "Date": "timestamp",
            "Last Updated": "last_updated",
            "User": "user_name",
        }
        pagination = Pagination(limit=None, current_page=1, order_by=[])
        filters = get_filters(
            combined_filters,
            filter_mapping,
            "Title",
            date_fields=["Date", "Last Updated"],
        )

        tasks, _ = get_all_tasks(session, pagination, **filters)
        csv_file = StringIO()
        writer = csv.writer(csv_file)
        writer.writerow(
            ["ID", "Title", "User", "Project", "Status", "Timestamp"]
        )
        for task in tasks:
            writer.writerow(
                [
                    task.id,
                    task.title,
                    task.user_name,
                    task.project_name,
                    task.status,
                    datetime.fromtimestamp(task.timestamp).strftime(
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
            "attachment; filename=tasks.csv"
        )
        return response
    except Exception as e:
        logger.error(f"Error exporting tasks: {e}")
        raise HTTPException(status_code=500, detail="Error exporting tasks")


@task_router.get("/{task_id}", response_class=HTMLResponse)
def get_task_endpoint(
    request: Request,
    task_id: str,
    session: ISession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Endpoint to retrieve a specific task.
    """
    try:
        task = get_task(session, id=task_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))
    return templates.TemplateResponse(
        "task/detail.html", {"request": request, "task": task}
    )


@task_router.put("/{task_id}", response_model=TaskResponseModel)
def update_task_endpoint(
    task_id: str,
    task_update: TaskCreateModel,
    session: ISession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Endpoint to update an existing task.
    """
    with session as s:
        task_repo = Repository(s, Task)
        task_to_update = task_repo.get(id=task_id)
        if not task_to_update:
            raise HTTPException(status_code=404, detail="Task not found")

        if (
            not is_admin(current_user)
            and task_to_update.user_id != current_user.id
        ):
            raise HTTPException(
                status_code=403, detail="Not authorized to update this task"
            )

    if (
        task_update.user_id
        and task_update.user_id != task_to_update.user_id
        and not is_admin(current_user)
    ):
        raise HTTPException(
            status_code=403, detail="Not authorized to change task owner"
        )

    try:
        if (
            not is_admin(current_user)
            and task_update.user_id
            and task_update.user_id != current_user.id
        ):
            task_update.user_id = current_user.id

        updated_task_model = update_task(task_id, task_update, session)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating task {task_id}: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    return updated_task_model


@task_router.post("/upsert", response_model=TaskResponseModel)
def upsert_task_endpoint(
    task: TaskResponseModel, session: ISession = Depends(get_session)
):
    """
    Endpoint to upsert a task.
    """
    try:
        task = upsert_task(task, session)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return task


@task_router.get("/", response_model=List[TaskResponseModel])
def get_all_tasks_endpoint(
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
        "Title": Task.title,
        "Hours Required": Task.hours_required,
        "Hours Worked": Task.hours_worked,
        "Status": Task.status,
        "Date": Task.timestamp,
        "Last Updated": Task.last_updated,
    }

    order_by = get_sorting(sort, order, sort_mapping)
    filter_mapping = {
        "Title": "title",
        "Project": "project_name",
        "Hours Required": "hours_required",
        "Hours Worked": "hours_worked",
        "Status": "status",
        "Date": "timestamp",
        "Last Updated": "last_updated",
        "User": "user_name",
    }

    filters = get_filters(
        combined_filters,
        filter_mapping,
        "Title",
        date_fields=["Date", "Last Updated"],
    )

    actual_limit = limit if limit <= 100 else 100
    pagination = Pagination(
        limit=actual_limit, current_page=page, order_by=order_by
    )

    if is_admin(current_user):
        tasks, _ = get_all_tasks(session, pagination, **filters)
    else:
        user_specific_filters = filters.copy()
        if "user_id" not in user_specific_filters:
            user_specific_filters["user_id"] = current_user.id
        else:
            pass
        tasks, _ = get_user_tasks(
            session, current_user.id, pagination, **filters
        )

    return tasks


@task_router.get("/project/{project_id}", response_class=HTMLResponse)
def get_tasks_by_project_endpoint(
    request: Request,
    project_id: str,
    page: int = 1,
    sort: Optional[str] = None,
    order: Optional[str] = None,
    limit: int = 15,
    session: ISession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    sort_mapping = {
        "Title": Task.title,
        "Hours Required": Task.hours_required,
        "Hours Worked": Task.hours_worked,
        "Status": Task.status,
        "Date": Task.timestamp,
        "Last Updated": Task.last_updated,
    }

    order_by = get_sorting(sort, order, sort_mapping)
    pagination = Pagination(limit=limit, current_page=page, order_by=order_by)

    tasks, pagination = get_project_tasks(session, project_id, pagination)

    context = {
        "request": request,
        "headers": [
            "Title",
            "Project",
            "Hours Required",
            "Hours Worked",
            "Description",
            "Date",
            "Status",
            "Logs",
            "Last Updated",
        ],
        "data": tasks,
        "pagination": pagination,
        "entity": "task",
        "current_sort": sort,
        "current_order": order,
    }
    return templates.TemplateResponse("task/tasks.html", context)


@task_router.get("/user/{user_id}", response_class=HTMLResponse)
def get_tasks_by_user_endpoint(
    request: Request,
    user_id: str,
    page: int = 1,
    sort: Optional[str] = None,
    order: Optional[str] = None,
    limit: int = 15,
    session: ISession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    sort_mapping = {
        "Title": Task.title,
        "Hours Required": Task.hours_required,
        "Hours Worked": Task.hours_worked,
        "Status": Task.status,
        "Date": Task.timestamp,
        "Last Updated": Task.last_updated,
    }

    order_by = get_sorting(sort, order, sort_mapping)
    pagination = Pagination(limit=limit, current_page=page, order_by=order_by)

    if current_user.id != user_id and not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Access forbidden")

    tasks, pagination = get_user_tasks(session, user_id, pagination)

    context = {
        "request": request,
        "headers": [
            "Title",
            "Project",
            "Hours Required",
            "Hours Worked",
            "Description",
            "Date",
            "Status",
            "Logs",
            "Last Updated",
        ],
        "data": tasks,
        "pagination": pagination,
        "entity": "task",
        "current_sort": sort,
        "current_order": order,
    }
    return templates.TemplateResponse("task/tasks.html", context)


@task_router.get("/{task_id}/logs", response_class=HTMLResponse)
def get_logs_by_task_endpoint(
    request: Request,
    task_id: str,
    page: int = 1,
    sort: Optional[str] = None,
    order: Optional[str] = None,
    limit: int = 15,
    session: ISession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    sort_mapping = {
        "ID": Log.id,
        "Task Name": Log.task_name,
        "Hours ": Log.hours_spent_today,
        "Task Status": Log.task_status,
        "Date": Log.timestamp,
    }

    order_by = get_sorting(sort, order, sort_mapping)

    pagination = Pagination(limit=limit, current_page=page, order_by=order_by)

    logs, pagination = get_task_logs(session, task_id, pagination)

    context = {
        "request": request,
        "headers": [
            "Task Name",
            "User",
            "Hours Worked",
            "Description",
            "Date",
            "Task Status",
            "Actions",
        ],
        "data": logs,
        "pagination": pagination,
        "entity": "log",
        "current_sort": sort,
        "current_order": order,
    }
    return templates.TemplateResponse("log/logs.html", context)


@task_router.delete("/{task_id}", status_code=204)
async def delete_task_endpoint(
    task_id: str,
    session: ISession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if not is_admin(current_user):
        # Or add logic to allow task owner to delete if desired, with checks
        raise HTTPException(
            status_code=403, detail="Access forbidden. Admin only."
        )

    with session as s:
        task_repo = Repository(s, Task)
        task_to_delete = task_repo.get(id=task_id)

        if not task_to_delete:
            raise HTTPException(status_code=404, detail="Task not found")

        # Delete associated logs first
        log_repo = Repository(s, Log)
        associated_logs = log_repo.query(task_id=task_id)
        for log_entry in associated_logs:
            log_repo.delete(log_entry)

        # Then delete the task
        task_repo.delete(task_to_delete)
        s.commit()

    return Response(status_code=204)
