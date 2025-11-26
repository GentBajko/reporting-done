from types import TracebackType
from typing import (
    Any,
    Dict,
    List,
    Type,
    TypeVar,
    Protocol,
    runtime_checkable,
)

T = TypeVar("T")


@runtime_checkable
class ITransactional(Protocol):
    def commit(self) -> None: ...

    def rollback(self) -> None: ...


@runtime_checkable
class ISession(ITransactional, Protocol):
    def add(self, obj: object) -> None: ...

    def get(self, model: Type[T], id: Any) -> T | None: ...

    def update(self, obj: object) -> None: ...

    def delete(self, obj: object) -> None: ...

    def query(
        self,
        model: Type[T],
        order_by: List[Any] | None = None,
        limit: int | None = None,
        offset: int | None = None,
        options: List[Any] | None = None,
        in_: Dict[Any, List[Any]] | None = None,
        **filters: Any,
    ) -> List[T]: ...

    def execute(self, stmt: Any) -> None: ...

    def count(self, model: Type[T], **filters: Any) -> int: ...

    def __enter__(self) -> "ISession": ...

    def __exit__(
        self,
        exc_type: Type[BaseException] | None,
        exc_val: BaseException | None,
        exc_tb: TracebackType | None,
    ) -> None: ...


@runtime_checkable
class ISessionFactory(Protocol):
    def create(self) -> ISession: ...
