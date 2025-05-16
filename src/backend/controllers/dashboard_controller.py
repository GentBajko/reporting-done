from typing import Union

from fastapi import Depends, Request, APIRouter, HTTPException
from pydantic import BaseModel
from fastapi.responses import HTMLResponse, RedirectResponse

from backend.views import log_view, task_view, project_view
from core.models.user import User
from backend.dependencies import get_session
from backend.models.models import (
    LogResponseModel,
    TaskResponseModel,
    ProjectResponseModel,
)
from core.enums.task_status import TaskStatus
from backend.dependencies.auth import is_admin, get_current_user
from backend.models.pagination import Pagination
from database.interfaces.session import ISession

dashboard_router = APIRouter()


class DashboardSummaryResponse(BaseModel):
    active_projects_count: int
    pending_tasks_count: int
    recent_logs_count: int
    is_admin_user: bool


@dashboard_router.get("/", response_class=HTMLResponse)
async def home(
    request: Request,
    session: ISession = Depends(get_session),
    current_user: Union[User, RedirectResponse] = Depends(get_current_user),
):
    if isinstance(current_user, User):
        return RedirectResponse(url="/task")
    request.session.clear()
    return RedirectResponse(url="/user/login")


@dashboard_router.get(
    "/api/dashboard/summary", response_model=DashboardSummaryResponse
)
async def get_dashboard_summary(
    session: ISession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if not isinstance(current_user, User):
        raise HTTPException(status_code=401, detail="Not authenticated")

    user_is_admin = is_admin(current_user)
    user_id_to_query = current_user.id

    no_limit_pagination = Pagination(limit=10000, current_page=1)

    if user_is_admin:
        projects, proj_pagination = project_view.get_all_projects(
            session, no_limit_pagination, archived=False
        )
        active_projects_count = proj_pagination.total_items
    else:
        projects, _ = project_view.get_users_projects(
            user_id_to_query, session, no_limit_pagination, archived=False
        )
        active_projects_count = sum(1 for p in projects if not p.archived)

    pending_tasks_count = 0
    pending_statuses = [
        status.value
        for status in TaskStatus
        if status not in [TaskStatus.DONE, TaskStatus.COMPLETED]
    ]

    if user_is_admin:
        tasks, _ = task_view.get_all_tasks(session, no_limit_pagination)
        pending_tasks_count = sum(
            1
            for t in tasks
            if t.status
            and t.status
            not in [TaskStatus.DONE.value, TaskStatus.COMPLETED.value]
        )
    else:
        tasks, _ = task_view.get_user_tasks(
            session, user_id_to_query, no_limit_pagination
        )
        pending_tasks_count = sum(
            1
            for t in tasks
            if t.status
            and t.status
            not in [TaskStatus.DONE.value, TaskStatus.COMPLETED.value]
        )

    if user_is_admin:
        logs, log_pagination = log_view.get_all_logs(
            session, no_limit_pagination
        )
        recent_logs_count = log_pagination.total_items
    else:
        logs, log_pagination = log_view.get_user_logs(
            session, user_id_to_query, no_limit_pagination
        )
        recent_logs_count = log_pagination.total_items

    return DashboardSummaryResponse(
        active_projects_count=active_projects_count,
        pending_tasks_count=pending_tasks_count,
        recent_logs_count=recent_logs_count,
        is_admin_user=user_is_admin,
    )
