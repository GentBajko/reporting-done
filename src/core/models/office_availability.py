from typing import TYPE_CHECKING
from datetime import date

from ulid import ULID


class OfficeAvailability:
    """Tracks whether a user was present at the office on a given day."""

    if TYPE_CHECKING:
        id: str
        user_id: str
        day: date
        present: bool

    def __init__(
        self,
        user_id: str,
        day: date,
        present: bool = False,
        id: str | None = None,
    ):
        self.id = id or str(ULID())
        self.user_id = user_id
        self.day = day
        self.present = present

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
            "day": self.day.isoformat(),
            "present": self.present,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "OfficeAvailability":
        day = data["day"]
        if isinstance(day, str):
            day = date.fromisoformat(day)

        return cls(
            id=data.get("id"),
            user_id=data["user_id"],
            day=day,
            present=data.get("present", False),
        )
