from typing import Any, Dict, List, Type, Generic, TypeVar, Optional

from database.interfaces.session import ISession

T = TypeVar("T")


class Repository(Generic[T]):
    def __init__(self, session: ISession, model: Type[T]):
        self.session = session
        self.model = model

    def create(self, obj: T) -> T:
        self.session.add(obj)
        self.session.commit()
        return obj

    def get(self, id: Any) -> Optional[T]:
        return self.session.get(self.model, id)

    def update(self, obj: T) -> T:
        self.session.update(obj)
        self.session.commit()
        return obj

    def delete(self, obj: T) -> None:
        self.session.delete(obj)
        self.session.commit()

    def query(
        self,
        *expressions: Any,
        order_by: Optional[List[Any]] = None,
        limit: Optional[int] = None,
        offset: Optional[int] = None,
        options: Optional[List[Any]] = None,
        in_: Optional[Dict[Any, List[Any]]] = None,
        **filters: Any,
    ) -> List[T]:
        return self.session.query(
            self.model,
            *expressions,
            order_by=order_by,
            limit=limit,
            offset=offset,
            options=options,
            in_=in_,
            **filters,
        )

    def filter(self, *expressions: Any):
        """Return a SQLAlchemy query filtered by the given expressions."""
        base_session = getattr(self.session, "_session", None)
        if base_session is None:
            raise AttributeError("Underlying session is not accessible")
        return base_session.query(self.model).filter(*expressions)

    def count(self, **filters) -> int:
        return self.session.count(self.model, **filters)
