from typing import List, Optional

from pydantic import Field, BaseModel


class PydanticBackendDailyAvailability(BaseModel):
    date: str  # YYYY-MM-DD
    status: str  # "Office", "Remote", "Off", or other custom
    day_of_week: int


class PydanticBackendTask(BaseModel):
    id: str
    title: str
    description: str
    timestamp: int  # Unix timestamp in seconds
    status: Optional[str] = None


class PydanticBackendUserCalendarResponse(BaseModel):
    user_id: str
    user_name: str
    year: int
    month: int
    availability: List[PydanticBackendDailyAvailability]
    tasks: List[PydanticBackendTask]
