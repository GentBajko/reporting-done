from typing import List, Optional

from fastapi import (
    Form,
    Query,
    Depends,
    Request,
    Response,
    APIRouter,
    HTTPException,
)
from fastapi.responses import HTMLResponse, RedirectResponse

from backend.models import (
    ProjectCreateModel,
    ProjectResponseModel,
)
from database.models import project_mapper  # noqa F401
from core.models.task import Task
from core.models.user import User
from core.models.project import Project
from backend.dependencies import get_session
from backend.utils.templates import templates
from backend.utils.pagination import calculate_pagination
from backend.dependencies.auth import (
    is_admin,
    validate_csrf,
    get_current_user,
)
from backend.models.pagination import Pagination
from backend.views.project_view import (
    get_project,
    create_project,
    update_project,
    upsert_project,
    get_all_projects,
    get_project_tasks,
    get_users_projects,
    get_user_by_project,
    assign_project_to_user,
    remove_user_from_project,
)
from database.interfaces.session import ISession
from backend.utils.filters_and_sort import get_filters, get_sorting

project_router = APIRouter(prefix="/project")


@project_router.get("/create", response_class=HTMLResponse)
def create_project_page(
    request: Request, current_user: User = Depends(get_current_user)
):
    if not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Access forbidden")
    return templates.TemplateResponse(
        "project/create.html", {"request": request}
    )


@project_router.post("/")
async def create_project_endpoint(
    request: Request,
    name: str = Form(...),
    email: str = Form(""),
    send_email: bool = Form(False),
    archived: bool = Form(False),
    session: ISession = Depends(get_session),
    current_user: User = Depends(get_current_user),
    csrf_protect=Depends(validate_csrf),
):
    if not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Access forbidden")
    project_data = ProjectCreateModel(
        name=name,
        email=email,
        send_email=send_email,
        archived=archived,
    )
    created_project_model = create_project(project_data, session)
    return created_project_model


@project_router.get("/options", response_class=HTMLResponse)
def get_project_options(
    request: Request,
    session: ISession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    pagination = calculate_pagination(total=0, page=1, per_page=300)
    projects = (
        get_all_projects(session, pagination)[0]
        if is_admin(current_user)
        else [
            project
            for project in get_users_projects(
                current_user.id, session, pagination
            )[0]
        ]
    )

    options_html = ""
    for project in projects:
        options_html += f'<option value="{project.id}">{project.name}</option>'

    return HTMLResponse(content=options_html)


@project_router.get("/{project_id}", response_class=HTMLResponse)
def get_project_endpoint(
    request: Request,
    project_id: str,
    session: ISession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    project = get_project(session, id=project_id)
    pagination = calculate_pagination(total=0, page=1, per_page=15)
    user_projects = get_users_projects(current_user.id, session, pagination)
    project_ids = [project.id for project in user_projects[0]]

    if not is_admin(current_user) and project_id not in project_ids:
        raise HTTPException(status_code=403, detail="Access forbidden")
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    return templates.TemplateResponse(
        "project/detail.html", {"request": request, "project": project}
    )


@project_router.get("/{project_id}/edit", response_model=ProjectResponseModel)
def update_project_page(
    request: Request,
    project_id: str,
    session: ISession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Access forbidden")

    project = get_project(session, id=project_id)

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    return templates.TemplateResponse(
        "project/edit.html", {"project": project, "request": request}
    )


@project_router.put("/{project_id}", response_model=ProjectResponseModel)
async def update_project_endpoint(
    request: Request,
    project_id: str,
    name: str = Form(...),
    send_email: bool = Form(False),
    archived: bool = Form(False),
    email: str = Form(""),
    csrftoken: str = Form(""),
    session: ISession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Access forbidden")

    project_update = ProjectCreateModel(
        name=name, send_email=send_email, archived=archived, email=email
    )

    updated_project_model = update_project(project_id, project_update, session)

    return updated_project_model


@project_router.delete("/{project_id}", status_code=204)
async def delete_project_endpoint(
    project_id: str,
    session: ISession = Depends(get_session),
    current_user: User = Depends(get_current_user),
    # csrf_protect = Depends(validate_csrf) # If using form/session for CSRF with JS calls
):
    if not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Access forbidden")

    with session as s:
        repo = Repository(s, Project)
        project_to_delete = repo.get(id=project_id)

        if not project_to_delete:
            raise HTTPException(status_code=404, detail="Project not found")

        # TODO: Consider implications for associated tasks.
        # - Option 1: Prevent deletion if tasks exist.
        # - Option 2: Delete associated tasks (cascade - needs careful thought on logs etc).
        # - Option 3: Disassociate tasks (set project_id to null - if schema allows).
        # For now, attempting direct deletion. This might fail if DB has FK constraints.

        # Example check (can be expanded):
        # task_repo = Repository(s, Task)
        # existing_tasks = task_repo.query(project_id=project_id, limit=1)
        # if existing_tasks:
        #     raise HTTPException(status_code=400, detail="Cannot delete project with associated tasks. Please reassign or delete tasks first.")

        repo.delete(project_to_delete)
        s.commit()

    return Response(status_code=204)


@project_router.post("/upsert", response_model=ProjectResponseModel)
def upsert_project_endpoint(
    project: ProjectCreateModel, session: ISession = Depends(get_session)
):
    return upsert_project(project, session)


@project_router.get("/", response_model=List[ProjectResponseModel])
def get_all_projects_endpoint(
    request: Request,
    page: int = Query(1, alias="page"),
    sort: Optional[str] = Query("Name", alias="sort"),
    order: Optional[str] = Query("desc", alias="order"),
    limit: int = Query(15, alias="limit"),
    combined_filters: Optional[str] = Query(None, alias="filters"),
    session: ISession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    filter_mapping = {
        "Name": "name",
        "Email": "email",
        "Send Email": "send_email",
        "Archived": "archived",
    }

    sort_mapping = {
        "Name": Project.name,
        "Email": Project.email,
        "Send Email": Project.send_email,
        "Archived": Project.archived,
    }

    order_by = get_sorting(sort, order, sort_mapping)
    actual_limit = limit if limit <= 100 else 100

    pagination = Pagination(
        limit=actual_limit, current_page=page, order_by=order_by
    )

    filters = get_filters(combined_filters, filter_mapping, "Name")

    if is_admin(current_user):
        projects, _ = get_all_projects(session, pagination, **filters)
    else:
        projects, _ = get_users_projects(
            current_user.id, session, pagination, **filters
        )

    return projects


@project_router.get("/{project_id}/assign", response_class=HTMLResponse)
def assign_project_to_user_page(
    request: Request,
    project_id: str,
    session: ISession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Access forbidden")
    project = get_project(session, id=project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return templates.TemplateResponse(
        "project/assign.html", {"request": request, "project": project}
    )


@project_router.post(
    "/{project_id}/assign", response_model=ProjectResponseModel
)
def assign_project_to_user_endpoint(
    request: Request,
    project_id: str,
    user_id: str = Form(...),
    session: ISession = Depends(get_session),
):
    assignment = assign_project_to_user(project_id, user_id, session)
    return templates.TemplateResponse(
        "project/detail.html", {"project": assignment, "request": request}
    )


@project_router.get("/{project_id}/remove_user", response_class=HTMLResponse)
def remove_user_from_project_page(
    request: Request,
    project_id: str,
    page: int = 1,
    sort: Optional[str] = None,
    order: Optional[str] = None,
    limit: int = 50,
    session: ISession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Endpoint to retrieve users associated with a specific project with pagination.
    """
    sort_mapping = {
        "Name": User.full_name,
        "Email": User.email,
    }

    order_by = get_sorting(sort, order, sort_mapping)
    pagination = Pagination(limit=limit, current_page=page, order_by=order_by)

    users, pagination = get_user_by_project(session, project_id, pagination)

    options_html = "".join(
        f'<option value="{user.id}">{user.full_name} ({user.email})</option>'
        for user in users
    )

    context = {
        "request": request,
        "project": {"id": project_id},
        "options": options_html,
        "pagination": pagination,
        "entity": "user",
        "current_sort": sort,
        "current_order": order,
    }
    return templates.TemplateResponse("project/remove_user.html", context)


@project_router.post(
    "/{project_id}/remove_user", response_model=ProjectResponseModel
)
def remove_user_from_project_endpoint(
    request: Request,
    project_id: str,
    user_id: str = Form(...),
    session: ISession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Access forbidden")
    remove_user_from_project(project_id, user_id, session)
    return RedirectResponse(url=f"/project/{project_id}", status_code=303)


@project_router.get("/{project_id}/users", response_class=HTMLResponse)
def get_user_by_project_endpoint(
    request: Request,
    project_id: str,
    page: int = 1,
    sort: Optional[str] = None,
    order: Optional[str] = None,
    limit: int = 15,
    session: ISession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Endpoint to retrieve users associated with a specific project with pagination.
    """
    sort_mapping = {
        "Name": User.full_name,
        "Email": User.email,
    }

    order_by = get_sorting(sort, order, sort_mapping)
    pagination = Pagination(limit=limit, current_page=page, order_by=order_by)

    users, pagination = get_user_by_project(session, project_id, pagination)

    context = {
        "request": request,
        "headers": ["Name", "Email", "Projects", "Tasks"],
        "data": users,
        "pagination": pagination,
        "entity": "user",
        "current_sort": sort,
        "current_order": order,
    }
    return templates.TemplateResponse("user/users.html", context)


@project_router.get("/{project_id}/tasks", response_class=HTMLResponse)
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
    """
    Endpoint to retrieve tasks associated with a specific project with pagination.
    """
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
