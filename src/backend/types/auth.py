from dataclasses import dataclass
from backend.types.identifiers import UserId


@dataclass(frozen=True, slots=True)
class AuthCredentials:
    email: str
    password: str


@dataclass(frozen=True, slots=True)
class AuthToken:
    access_token: str
    token_type: str = "bearer"
    expires_in: int = 3600


@dataclass(frozen=True, slots=True)
class AuthenticatedUser:
    user_id: UserId
    email: str
    full_name: str
    permissions: int
    is_admin: bool


@dataclass(frozen=True, slots=True)
class SessionData:
    user_id: UserId
    csrf_token: str
    created_at: int
    expires_at: int

