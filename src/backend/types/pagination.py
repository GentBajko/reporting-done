from typing import TypeVar, Generic, Sequence
from dataclasses import dataclass, field

T = TypeVar("T")


@dataclass(frozen=True, slots=True)
class PaginationParams:
    page: int = 1
    per_page: int = 25
    sort_by: str | None = None
    sort_order: str = "asc"
    
    @property
    def offset(self) -> int:
        return (self.page - 1) * self.per_page
    
    @property
    def limit(self) -> int:
        return self.per_page


@dataclass(frozen=True, slots=True)
class PaginationMeta:
    total_items: int
    total_pages: int
    current_page: int
    per_page: int
    has_next: bool
    has_prev: bool
    next_page: int | None
    prev_page: int | None
    start_index: int
    end_index: int
    page_range: Sequence[int]


@dataclass(slots=True)
class PaginatedResult(Generic[T]):
    items: Sequence[T]
    meta: PaginationMeta
    
    @property
    def total(self) -> int:
        return self.meta.total_items
    
    @property
    def page(self) -> int:
        return self.meta.current_page
    
    @property
    def has_next(self) -> bool:
        return self.meta.has_next
    
    @property
    def has_prev(self) -> bool:
        return self.meta.has_prev
    
    def map(self, fn) -> "PaginatedResult":
        return PaginatedResult(
            items=[fn(item) for item in self.items],
            meta=self.meta,
        )

