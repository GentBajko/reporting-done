from typing import Sequence

from fastapi import Query, Depends, APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from backend.services import LogService
from backend.types.dtos import LogDTO, LogCreateDTO, LogUpdateDTO
from backend.types.pagination import PaginationParams
from backend.types.result import Err
from backend.protocols.session import ISession
from backend.dependencies import (
    get_session,
    get_current_user,
    require_admin,
    is_admin,
    get_log_service,
)
from core.models.user import User


log_router = APIRouter(prefix="/log")


class LogCreateRequest(BaseModel):
    task_id: str
    description: str = Field(max_length=10000)
    hours_spent_today: float = Field(gt=0, le=24)
    task_status: str


class LogUpdateRequest(BaseModel):
    description: str | None = Field(default=None, max_length=10000)
    hours_spent_today: float | None = Field(default=None, gt=0, le=24)
    task_status: str | None = None


class PaginatedLogsResponse(BaseModel):
    items: Sequence[LogDTO]
    total: int
    page: int
    per_page: int
    has_next: bool
    has_prev: bool


@log_router.post("/", response_model=LogDTO)
async def create_log_endpoint(
    body: LogCreateRequest,
    session: ISession = Depends(get_session),
    current_user: User = Depends(get_current_user),
    log_service: LogService = Depends(get_log_service),
):
    dto = LogCreateDTO(
        task_id=body.task_id,
        description=body.description,
        hours_spent_today=body.hours_spent_today,
        task_status=body.task_status,
    )
    
    result = log_service.create(dto, current_user.id, session)
    
    if isinstance(result, Err):
        raise HTTPException(status_code=400, detail=result.error)
    
    return result.value


@log_router.get("/", response_model=PaginatedLogsResponse)
def get_all_logs_endpoint(
    page: int = Query(1, ge=1),
    limit: int = Query(15, ge=1, le=100),
    sort: str | None = Query(None),
    order: str = Query("desc"),
    session: ISession = Depends(get_session),
    current_user: User = Depends(get_current_user),
    log_service: LogService = Depends(get_log_service),
):
    pagination = PaginationParams(
        page=page,
        per_page=limit,
        sort_by=sort,
        sort_order=order,
    )
    
    if is_admin(current_user):
        result = log_service.list_all(pagination, session)
    else:
        result = log_service.list_for_user(current_user.id, pagination, session)
    
    return PaginatedLogsResponse(
        items=result.items,
        total=result.total,
        page=result.page,
        per_page=result.meta.per_page,
        has_next=result.has_next,
        has_prev=result.has_prev,
    )


@log_router.get("/export", response_class=StreamingResponse)
def export_logs_csv(
    session: ISession = Depends(get_session),
    current_user: User = Depends(require_admin),
    log_service: LogService = Depends(get_log_service),
):
    result = log_service.export_to_csv(session)
    
    if isinstance(result, Err):
        raise HTTPException(status_code=500, detail=result.error)
    
    return StreamingResponse(
        iter([result.value]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=logs.csv"},
    )


@log_router.get("/{log_id}", response_model=LogDTO)
def get_log_endpoint(
    log_id: str,
    session: ISession = Depends(get_session),
    current_user: User = Depends(get_current_user),
    log_service: LogService = Depends(get_log_service),
):
    result = log_service.get_by_id(log_id, session)
    
    if isinstance(result, Err):
        raise HTTPException(status_code=404, detail=result.error)
    
    log = result.value
    
    if not is_admin(current_user) and log.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access forbidden")
    
    return log


@log_router.put("/{log_id}", response_model=LogDTO)
async def update_log_endpoint(
    log_id: str,
    body: LogUpdateRequest,
    session: ISession = Depends(get_session),
    current_user: User = Depends(get_current_user),
    log_service: LogService = Depends(get_log_service),
):
    dto = LogUpdateDTO(
        description=body.description,
        hours_spent_today=body.hours_spent_today,
        task_status=body.task_status,
    )
    
    result = log_service.update(
        log_id,
        dto,
        current_user.id,
        is_admin(current_user),
        session,
    )
    
    if isinstance(result, Err):
        raise HTTPException(status_code=400, detail=result.error)
    
    return result.value


@log_router.delete("/{log_id}", status_code=204)
async def delete_log_endpoint(
    log_id: str,
    session: ISession = Depends(get_session),
    current_user: User = Depends(get_current_user),
    log_service: LogService = Depends(get_log_service),
):
    result = log_service.delete(
        log_id,
        current_user.id,
        is_admin(current_user),
        session,
    )
    
    if isinstance(result, Err):
        raise HTTPException(status_code=400, detail=result.error)
