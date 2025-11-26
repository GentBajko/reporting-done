from typing import Sequence, Literal
from datetime import date
from dataclasses import dataclass, field
from pydantic import BaseModel, EmailStr, Field, field_validator
from backend.types.identifiers import UserId, ProjectId, TaskId, LogId

DayAvailabilityStatus = Literal["Office", "Remote", "Off"]


class UserCreateDTO(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str = Field(min_length=1, max_length=255)
    permissions: int = Field(ge=0)


class UserUpdateDTO(BaseModel):
    email: EmailStr | None = None
    full_name: str | None = Field(default=None, min_length=1, max_length=255)
    permissions: int | None = Field(default=None, ge=0)


class UserDTO(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    permissions: int
    projects: Sequence["ProjectDTO"] = Field(default_factory=list)
    tasks: Sequence["TaskDTO"] = Field(default_factory=list)
    
    model_config = {"from_attributes": True}


class ProjectCreateDTO(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    email: EmailStr | None = None
    send_email: bool = False
    archived: bool = False
    
    @field_validator("email", mode="before")
    @classmethod
    def empty_str_to_none(cls, v: str | None) -> str | None:
        if v == "":
            return None
        return v


class ProjectUpdateDTO(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    email: EmailStr | None = None
    send_email: bool | None = None
    archived: bool | None = None
    
    @field_validator("email", mode="before")
    @classmethod
    def empty_str_to_none(cls, v: str | None) -> str | None:
        if v == "":
            return None
        return v


class ProjectDTO(BaseModel):
    id: str
    name: str
    email: EmailStr | None = None
    send_email: bool
    archived: bool
    developers: Sequence["UserDTO"] = Field(default_factory=list)
    tasks: Sequence["TaskDTO"] = Field(default_factory=list)
    
    model_config = {"from_attributes": True}


class TaskCreateDTO(BaseModel):
    project_id: str
    title: str = Field(min_length=1, max_length=500)
    hours_required: float = Field(ge=0)
    description: str = Field(max_length=10000)
    status: str | None = None
    user_id: str | None = None


class TaskUpdateDTO(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=500)
    hours_required: float | None = Field(default=None, ge=0)
    description: str | None = Field(default=None, max_length=10000)
    status: str | None = None
    user_id: str | None = None
    returned: bool | None = None


class LogDTO(BaseModel):
    id: str
    task_id: str
    task_name: str
    description: str
    user_id: str
    user_name: str
    project_id: str
    project_name: str
    hours_spent_today: float
    task_status: str
    timestamp: int
    
    model_config = {"from_attributes": True}


class TaskDTO(BaseModel):
    id: str
    project_id: str
    project_name: str
    user_id: str
    user_name: str
    title: str
    hours_required: float
    hours_worked: float = 0.0
    returned: bool = False
    description: str
    status: str | None = None
    timestamp: int
    last_updated: int | None = None
    logs: Sequence[LogDTO] = Field(default_factory=list)
    
    model_config = {"from_attributes": True}


class LogCreateDTO(BaseModel):
    task_id: str
    description: str = Field(max_length=10000)
    hours_spent_today: float = Field(gt=0, le=24)
    task_status: str


class LogUpdateDTO(BaseModel):
    description: str | None = Field(default=None, max_length=10000)
    hours_spent_today: float | None = Field(default=None, gt=0, le=24)
    task_status: str | None = None


class AvailabilityDTO(BaseModel):
    date: date
    status: DayAvailabilityStatus
    day_of_week: int = Field(ge=0, le=6)
    
    model_config = {"from_attributes": True}


class MonthlyAvailabilityDTO(BaseModel):
    user_id: str
    user_name: str
    year: int = Field(ge=2000, le=2100)
    month: int = Field(ge=1, le=12)
    availability: Sequence[AvailabilityDTO]
    office_days_count: int = Field(ge=0)
    
    model_config = {"from_attributes": True}


UserDTO.model_rebuild()
ProjectDTO.model_rebuild()
TaskDTO.model_rebuild()

