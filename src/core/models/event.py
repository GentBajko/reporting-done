from typing import TYPE_CHECKING, Optional
from datetime import datetime

from ulid import ULID


class Event:
    if TYPE_CHECKING:
        id: str
        user_id: str
        title: str
        description: Optional[str]
        event_type: str
        event_date: int
        created_at: int

    def __init__(
        self,
        user_id: str,
        title: str,
        event_type: str,
        event_date: int,
        description: Optional[str] = None,
        created_at: Optional[int] = None,
        id: Optional[str] = None,
    ):
        self.id = id or str(ULID())
        self.user_id = user_id
        self.title = title
        self.description = description
        self.event_type = event_type
        self.event_date = event_date
        self.created_at = created_at or int(datetime.now().timestamp())

    @property
    def _id(self) -> ULID:
        return ULID.from_str(self.id)

    @property
    def _user_id(self) -> ULID:
        return ULID.from_str(self.user_id)

    @property
    def _event_date(self) -> datetime:
        return datetime.fromtimestamp(self.event_date)

    @property
    def _created_at(self) -> datetime:
        return datetime.fromtimestamp(self.created_at)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "description": self.description,
            "event_type": self.event_type,
            "event_date": self.event_date,
            "created_at": self.created_at,
        }

    @classmethod
    def from_dict(cls, data):
        return cls(
            id=data["id"],
            user_id=data["user_id"],
            title=data["title"],
            description=data.get("description"),
            event_type=data["event_type"],
            event_date=data["event_date"],
            created_at=data.get("created_at"),
        )

