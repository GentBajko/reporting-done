from typing import Any, List, Sequence
from pydantic import BaseModel, Field


class Pagination(BaseModel):
    order_by: List[Any] | None = None
    limit: int | None = Field(default=None, ge=1, le=100)
    offset: int | None = Field(default=None, ge=0)
    total: int | None = Field(default=None, ge=0)
    total_items: int | None = Field(default=None, ge=0)
    current_page: int | None = Field(default=None, ge=1)
    has_prev: bool | None = None
    has_next: bool | None = None
    prev_page: int | None = None
    next_page: int | None = None
    start_index: int | None = Field(default=None, ge=0)
    end_index: int | None = Field(default=None, ge=0)
    page_range: Sequence[int] | None = None
    
    model_config = {"extra": "allow"}
