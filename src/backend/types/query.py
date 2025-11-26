from typing import Literal, Sequence
from datetime import date, datetime
from dataclasses import dataclass

FilterOperator = Literal["eq", "gt", "gte", "lt", "lte", "contains", "startswith", "endswith", "in"]
FilterValue = str | int | float | bool | date | datetime | Sequence[str] | Sequence[int]


@dataclass(frozen=True, slots=True)
class FilterCondition:
    field: str
    operator: FilterOperator
    value: FilterValue


FilterDict = dict[str, FilterValue]
OrderDirection = Literal["asc", "desc"]


@dataclass(frozen=True, slots=True)
class OrderByItem:
    field: str
    direction: OrderDirection = "asc"


OrderByList = Sequence[OrderByItem] | Sequence[str]


@dataclass(frozen=True, slots=True)
class QueryOptions:
    eager_load: Sequence[str] | None = None
    select_fields: Sequence[str] | None = None
    distinct: bool = False

