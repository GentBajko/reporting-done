from functools import lru_cache

from backend.services import (
    AuthService,
    UserService,
    ProjectService,
    TaskService,
    LogService,
    AvailabilityService,
    PaginationService,
)


@lru_cache(maxsize=1)
def get_pagination_service() -> PaginationService:
    return PaginationService()


@lru_cache(maxsize=1)
def get_auth_service() -> AuthService:
    return AuthService()


@lru_cache(maxsize=1)
def get_user_service() -> UserService:
    return UserService(
        auth_service=get_auth_service(),
        paginator=get_pagination_service(),
    )


@lru_cache(maxsize=1)
def get_project_service() -> ProjectService:
    return ProjectService(
        paginator=get_pagination_service(),
    )


@lru_cache(maxsize=1)
def get_task_service() -> TaskService:
    return TaskService(
        paginator=get_pagination_service(),
    )


@lru_cache(maxsize=1)
def get_log_service() -> LogService:
    return LogService(
        paginator=get_pagination_service(),
    )


@lru_cache(maxsize=1)
def get_availability_service() -> AvailabilityService:
    return AvailabilityService()

