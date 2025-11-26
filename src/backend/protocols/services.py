from typing import Protocol, Sequence, runtime_checkable
from datetime import date

from backend.types.auth import AuthToken, AuthCredentials, AuthenticatedUser
from backend.types.dtos import (
    LogDTO,
    TaskDTO,
    UserDTO,
    ProjectDTO,
    LogCreateDTO,
    LogUpdateDTO,
    TaskCreateDTO,
    TaskUpdateDTO,
    UserCreateDTO,
    UserUpdateDTO,
    AvailabilityDTO,
    ProjectCreateDTO,
    ProjectUpdateDTO,
    MonthlyAvailabilityDTO,
)
from backend.types.result import Result
from backend.types.pagination import PaginatedResult, PaginationParams


@runtime_checkable
class IAuthService(Protocol):
    def authenticate(
        self, credentials: AuthCredentials
    ) -> Result[AuthenticatedUser, str]: ...

    def validate_session(
        self, session_id: str
    ) -> Result[AuthenticatedUser, str]: ...

    def logout(self, session_id: str) -> Result[None, str]: ...

    def hash_password(self, password: str) -> str: ...

    def verify_password(self, password: str, hashed: str) -> bool: ...


@runtime_checkable
class IUserService(Protocol):
    def create(self, data: UserCreateDTO) -> Result[UserDTO, str]: ...

    def get_by_id(self, user_id: str) -> Result[UserDTO, str]: ...

    def get_by_email(self, email: str) -> Result[UserDTO, str]: ...

    def update(
        self, user_id: str, data: UserUpdateDTO
    ) -> Result[UserDTO, str]: ...

    def delete(self, user_id: str) -> Result[None, str]: ...

    def list_all(
        self, pagination: PaginationParams, **filters: str | int | bool
    ) -> PaginatedResult[UserDTO]: ...

    def get_user_projects(
        self, user_id: str, pagination: PaginationParams
    ) -> PaginatedResult[ProjectDTO]: ...

    def get_user_tasks(
        self, user_id: str, pagination: PaginationParams
    ) -> PaginatedResult[TaskDTO]: ...

    def get_user_logs(
        self, user_id: str, pagination: PaginationParams
    ) -> PaginatedResult[LogDTO]: ...


@runtime_checkable
class IProjectService(Protocol):
    def create(self, data: ProjectCreateDTO) -> Result[ProjectDTO, str]: ...

    def get_by_id(self, project_id: str) -> Result[ProjectDTO, str]: ...

    def update(
        self, project_id: str, data: ProjectUpdateDTO
    ) -> Result[ProjectDTO, str]: ...

    def delete(self, project_id: str) -> Result[None, str]: ...

    def list_all(
        self, pagination: PaginationParams, **filters: str | int | bool
    ) -> PaginatedResult[ProjectDTO]: ...

    def assign_user(
        self, project_id: str, user_id: str
    ) -> Result[ProjectDTO, str]: ...

    def remove_user(
        self, project_id: str, user_id: str
    ) -> Result[ProjectDTO, str]: ...

    def get_project_users(
        self, project_id: str, pagination: PaginationParams
    ) -> PaginatedResult[UserDTO]: ...

    def get_project_tasks(
        self, project_id: str, pagination: PaginationParams
    ) -> PaginatedResult[TaskDTO]: ...


@runtime_checkable
class ITaskService(Protocol):
    def create(
        self, data: TaskCreateDTO, user_id: str
    ) -> Result[TaskDTO, str]: ...

    def get_by_id(self, task_id: str) -> Result[TaskDTO, str]: ...

    def update(
        self, task_id: str, data: TaskUpdateDTO, user_id: str
    ) -> Result[TaskDTO, str]: ...

    def delete(self, task_id: str) -> Result[None, str]: ...

    def list_all(
        self, pagination: PaginationParams, **filters: str | int | bool
    ) -> PaginatedResult[TaskDTO]: ...

    def get_task_logs(
        self, task_id: str, pagination: PaginationParams
    ) -> PaginatedResult[LogDTO]: ...


@runtime_checkable
class ILogService(Protocol):
    def create(
        self, data: LogCreateDTO, user_id: str
    ) -> Result[LogDTO, str]: ...

    def get_by_id(self, log_id: str) -> Result[LogDTO, str]: ...

    def update(
        self, log_id: str, data: LogUpdateDTO, user_id: str
    ) -> Result[LogDTO, str]: ...

    def delete(self, log_id: str, user_id: str) -> Result[None, str]: ...

    def list_all(
        self, pagination: PaginationParams, **filters: str | int | bool
    ) -> PaginatedResult[LogDTO]: ...

    def export_to_csv(
        self, **filters: str | int | bool
    ) -> Result[bytes, str]: ...


@runtime_checkable
class IAvailabilityService(Protocol):
    def get_user_availability(
        self, user_id: str, year: int, month: int
    ) -> Result[MonthlyAvailabilityDTO, str]: ...

    def update_single_day(
        self, user_id: str, day: date, status: str
    ) -> Result[AvailabilityDTO, str]: ...

    def batch_update_month(
        self, user_id: str, year: int, month: int, office_dates: Sequence[date]
    ) -> Result[MonthlyAvailabilityDTO, str]: ...

    def get_office_users_for_date(
        self, target_date: date
    ) -> Sequence[UserDTO]: ...
