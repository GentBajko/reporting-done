from typing import Sequence

from pydantic import BaseModel, Field


class PydanticBackendDailyAvailability(BaseModel):
    date: str
    status: str
    day_of_week: int = Field(ge=0, le=6)
    
    model_config = {"str_strip_whitespace": True}


class PydanticBackendTask(BaseModel):
    id: str
    title: str = Field(max_length=500)
    description: str = Field(max_length=10000)
    created_at: int = Field(ge=0)
    status: str | None = None

    # Legacy field alias
    @property
    def timestamp(self) -> int:
        return self.created_at

    model_config = {"str_strip_whitespace": True}


class PydanticBackendUserCalendarResponse(BaseModel):
    user_id: str
    user_name: str = Field(max_length=255)
    year: int = Field(ge=2000, le=2100)
    month: int = Field(ge=1, le=12)
    availability: Sequence[PydanticBackendDailyAvailability]
    tasks: Sequence[PydanticBackendTask]
    
    model_config = {"from_attributes": True}
