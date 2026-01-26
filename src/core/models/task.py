from typing import TYPE_CHECKING, List, Optional
from datetime import datetime, timezone

from ulid import ULID

from core.enums.task_status import TaskStatus

if TYPE_CHECKING:
    from core.models.log import Log


class Task:
    if TYPE_CHECKING:
        id: str
        project_id: str
        project_name: str
        user_id: str
        user_name: str
        title: str
        hours_required: float
        returned: bool
        description: str
        status: Optional[str]
        created_at: datetime
        hours_worked: float
        updated_at: Optional[datetime]
        logs: Optional[List["Log"]]

    def __init__(
        self,
        project_id: str,
        project_name: str,
        user_id: str,
        user_name: str,
        title: str,
        hours_required: float,
        description: str,
        created_at: datetime | None = None,
        hours_worked: float = 0.0,
        returned: bool = False,
        updated_at: datetime | None = None,
        status: str | None = None,
        id: str | None = None,
        logs: list["Log"] | None = None,
    ):
        self.id = id or str(ULID())
        self.project_id = project_id
        self.project_name = project_name
        self.user_id = user_id
        self.user_name = user_name
        self.title = title
        self.hours_required = hours_required
        self.returned = returned
        self.description = description
        self.logs = logs
        self.status = status
        self.created_at = created_at or datetime.now(timezone.utc)
        self.hours_worked = hours_worked
        self.updated_at = updated_at

    @property
    def _id(self) -> ULID:
        return ULID.from_str(self.id)

    @property
    def _project_id(self) -> ULID:
        return ULID.from_str(self.project_id)

    @property
    def _status(self) -> TaskStatus | None:
        return TaskStatus(self.status) if self.status else None

    def to_dict(self, visited: set[int] | None = None) -> dict:
        if visited is None:
            visited = set()

        if id(self) in visited:
            return {
                "id": self.id,
                "project_id": self.project_id,
                "project_name": self.project_name,
                "user_id": self.user_id,
                "user_name": self.user_name,
                "title": self.title,
                "hours_required": self.hours_required,
                "updated_at": self.updated_at.isoformat() if self.updated_at else None,
                "description": self.description,
                "status": self.status,
                "created_at": self.created_at.isoformat(),
                "hours_worked": self.hours_worked,
                "logs": [],
            }

        visited.add(id(self))

        return {
            "id": self.id,
            "project_id": self.project_id,
            "project_name": self.project_name,
            "user_id": self.user_id,
            "user_name": self.user_name,
            "title": self.title,
            "hours_required": self.hours_required,
            "returned": self.returned,
            "description": self.description,
            "status": self.status,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "hours_worked": self.hours_worked,
            "logs": [log.to_dict(visited) for log in self.logs]
            if self.logs
            else [],
        }

    @classmethod
    def from_dict(cls, data: dict) -> "Task":
        from core.models.log import Log

        # Support legacy field names
        created_at = data.get("created_at") or data.get("timestamp")
        if isinstance(created_at, str):
            created_at = datetime.fromisoformat(created_at)
        elif isinstance(created_at, int):
            # Legacy support: convert epoch timestamp
            created_at = datetime.fromtimestamp(created_at, tz=timezone.utc)

        # Support legacy field names
        updated_at = data.get("updated_at") or data.get("last_updated")
        if isinstance(updated_at, str):
            updated_at = datetime.fromisoformat(updated_at)
        elif isinstance(updated_at, int):
            # Legacy support: convert epoch timestamp
            updated_at = datetime.fromtimestamp(updated_at, tz=timezone.utc)

        return cls(
            id=data["id"],
            project_id=data["project_id"],
            project_name=data["project_name"],
            user_id=data["user_id"],
            user_name=data["user_name"],
            title=data["title"],
            hours_required=data["hours_required"],
            returned=data.get("returned", False),
            description=data["description"],
            status=data.get("status"),
            created_at=created_at,
            updated_at=updated_at,
            hours_worked=data.get("hours_worked", 0.0),
            logs=[Log.from_dict(log) for log in data.get("logs", [])],
        )
