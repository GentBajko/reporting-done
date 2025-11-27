from typing import (
    Any,
    TypeVar,
    Protocol,
    List,
    Dict,
    runtime_checkable,
)

T_co = TypeVar("T_co", covariant=True)


@runtime_checkable
class IReadRepository(Protocol[T_co]):
    def get(self, entity_id: str) -> T_co | None: ...
    
    def get_by(self, **filters: Any) -> T_co | None: ...


@runtime_checkable
class IWriteRepository(Protocol[T_co]):
    def add(self, entity: Any) -> Any: ...
    
    def update(self, entity: Any) -> Any: ...
    
    def delete(self, entity: Any) -> None: ...


@runtime_checkable
class IQueryable(Protocol[T_co]):
    def query(
        self,
        filters: Dict[str, Any] | None = None,
        order_by: List[Any] | None = None,
        limit: int | None = None,
        offset: int | None = None,
        options: List[Any] | None = None,
    ) -> List[Any]: ...


@runtime_checkable
class ICountable(Protocol):
    def count(self, filters: Dict[str, Any] | None = None) -> int: ...


class IRepository(
    IReadRepository[T_co],
    IWriteRepository[T_co],
    IQueryable[T_co],
    ICountable,
    Protocol[T_co],
):
    pass
