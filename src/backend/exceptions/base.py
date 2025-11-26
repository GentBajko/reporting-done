from typing import Sequence
from dataclasses import dataclass, field


@dataclass(frozen=True, slots=True)
class BackendException(Exception):
    message: str
    code: str = "BACKEND_ERROR"
    details: dict[str, str] = field(default_factory=dict)
    
    def __str__(self) -> str:
        return self.message


@dataclass(frozen=True, slots=True)
class ValidationError(BackendException):
    code: str = "VALIDATION_ERROR"
    field_errors: dict[str, Sequence[str]] = field(default_factory=dict)
    
    def __str__(self) -> str:
        if self.field_errors:
            errors = "; ".join(
                f"{field}: {', '.join(msgs)}"
                for field, msgs in self.field_errors.items()
            )
            return f"{self.message}: {errors}"
        return self.message


@dataclass(frozen=True, slots=True)
class AuthenticationError(BackendException):
    code: str = "AUTHENTICATION_ERROR"


@dataclass(frozen=True, slots=True)
class AuthorizationError(BackendException):
    code: str = "AUTHORIZATION_ERROR"
    required_permissions: Sequence[str] = field(default_factory=list)


@dataclass(frozen=True, slots=True)
class NotFoundError(BackendException):
    code: str = "NOT_FOUND"
    entity_type: str = "Entity"
    entity_id: str | None = None
    
    def __str__(self) -> str:
        if self.entity_id:
            return f"{self.entity_type} with id '{self.entity_id}' not found"
        return f"{self.entity_type} not found"


@dataclass(frozen=True, slots=True)
class ConflictError(BackendException):
    code: str = "CONFLICT"
    conflicting_field: str | None = None
    
    def __str__(self) -> str:
        if self.conflicting_field:
            return f"{self.message}: conflict on field '{self.conflicting_field}'"
        return self.message


@dataclass(frozen=True, slots=True)
class BusinessRuleError(BackendException):
    code: str = "BUSINESS_RULE_VIOLATION"
    rule_name: str = ""

