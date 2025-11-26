from typing import TypeVar, Protocol, Generic, Sequence, runtime_checkable
from backend.types.pagination import PaginationParams, PaginationMeta

T = TypeVar("T", covariant=True)


@runtime_checkable
class IPaginatedResult(Protocol[T]):
    @property
    def items(self) -> Sequence[T]: ...
    
    @property
    def meta(self) -> PaginationMeta: ...
    
    @property
    def total(self) -> int: ...
    
    @property
    def page(self) -> int: ...
    
    @property
    def has_next(self) -> bool: ...
    
    @property
    def has_prev(self) -> bool: ...


@runtime_checkable
class IPaginator(Protocol):
    def paginate(
        self,
        total: int,
        params: PaginationParams,
    ) -> PaginationMeta: ...

