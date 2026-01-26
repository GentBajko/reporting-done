from typing import TYPE_CHECKING
from datetime import date, datetime, time, timezone

from ulid import ULID


class Event:
    if TYPE_CHECKING:
        id: str
        user_id: str
        title: str
        description: str | None
        event_type: str
        event_date: date
        start_time: time | None
        end_time: time | None
        created_at: datetime

    def __init__(
        self,
        user_id: str,
        title: str,
        event_type: str,
        event_date: date,
        description: str | None = None,
        start_time: time | None = None,
        end_time: time | None = None,
        created_at: datetime | None = None,
        id: str | None = None,
    ):
        self.id = id or str(ULID())
        self.user_id = user_id
        self.title = title
        self.description = description
        self.event_type = event_type
        self.event_date = event_date
        self.start_time = start_time
        self.end_time = end_time
        self.created_at = created_at or datetime.now(timezone.utc)

    @property
    def _id(self) -> ULID:
        return ULID.from_str(self.id)

    @property
    def _user_id(self) -> ULID:
        return ULID.from_str(self.user_id)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "description": self.description,
            "event_type": self.event_type,
            "event_date": self.event_date.isoformat(),
            "start_time": self.start_time.isoformat() if self.start_time else None,
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "created_at": self.created_at.isoformat(),
        }

    @classmethod
    def from_dict(cls, data: dict) -> "Event":
        event_date = data["event_date"]
        if isinstance(event_date, str):
            event_date = date.fromisoformat(event_date)
        elif isinstance(event_date, int):
            # Legacy support: convert epoch timestamp to date
            event_date = datetime.fromtimestamp(event_date, tz=timezone.utc).date()

        start_time = data.get("start_time")
        if isinstance(start_time, str):
            start_time = time.fromisoformat(start_time)

        end_time = data.get("end_time")
        if isinstance(end_time, str):
            end_time = time.fromisoformat(end_time)

        created_at = data.get("created_at")
        if isinstance(created_at, str):
            created_at = datetime.fromisoformat(created_at)
        elif isinstance(created_at, int):
            # Legacy support: convert epoch timestamp
            created_at = datetime.fromtimestamp(created_at, tz=timezone.utc)

        return cls(
            id=data["id"],
            user_id=data["user_id"],
            title=data["title"],
            description=data.get("description"),
            event_type=data["event_type"],
            event_date=event_date,
            start_time=start_time,
            end_time=end_time,
            created_at=created_at,
        )
