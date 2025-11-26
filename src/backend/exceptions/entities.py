from dataclasses import dataclass, field
from backend.exceptions.base import (
    NotFoundError,
    ConflictError,
    AuthenticationError,
    AuthorizationError,
    ValidationError,
)


@dataclass(frozen=True, slots=True)
class UserNotFoundError(NotFoundError):
    entity_type: str = "User"
    code: str = "USER_NOT_FOUND"


@dataclass(frozen=True, slots=True)
class UserAlreadyExistsError(ConflictError):
    code: str = "USER_ALREADY_EXISTS"
    conflicting_field: str = "email"


@dataclass(frozen=True, slots=True)
class InvalidCredentialsError(AuthenticationError):
    code: str = "INVALID_CREDENTIALS"
    message: str = "Invalid email or password"


@dataclass(frozen=True, slots=True)
class ProjectNotFoundError(NotFoundError):
    entity_type: str = "Project"
    code: str = "PROJECT_NOT_FOUND"


@dataclass(frozen=True, slots=True)
class TaskNotFoundError(NotFoundError):
    entity_type: str = "Task"
    code: str = "TASK_NOT_FOUND"


@dataclass(frozen=True, slots=True)
class LogNotFoundError(NotFoundError):
    entity_type: str = "Log"
    code: str = "LOG_NOT_FOUND"


@dataclass(frozen=True, slots=True)
class AvailabilityNotFoundError(NotFoundError):
    entity_type: str = "Availability"
    code: str = "AVAILABILITY_NOT_FOUND"


@dataclass(frozen=True, slots=True)
class InvalidDateRangeError(ValidationError):
    code: str = "INVALID_DATE_RANGE"
    message: str = "Invalid date range specified"


@dataclass(frozen=True, slots=True)
class PermissionDeniedError(AuthorizationError):
    code: str = "PERMISSION_DENIED"
    message: str = "You do not have permission to perform this action"

