from typing import TypeVar, Generic, Callable, Union
from dataclasses import dataclass

T = TypeVar("T")
E = TypeVar("E")
U = TypeVar("U")


@dataclass(frozen=True, slots=True)
class Ok(Generic[T]):
    value: T
    
    @property
    def is_ok(self) -> bool:
        return True
    
    @property
    def is_err(self) -> bool:
        return False
    
    def unwrap(self) -> T:
        return self.value
    
    def unwrap_or(self, default: T) -> T:
        return self.value
    
    def map(self, fn: Callable[[T], U]) -> "Ok[U]":
        return Ok(fn(self.value))


@dataclass(frozen=True, slots=True)
class Err(Generic[E]):
    error: E
    
    @property
    def is_ok(self) -> bool:
        return False
    
    @property
    def is_err(self) -> bool:
        return True
    
    def unwrap(self) -> None:
        raise ValueError(f"Called unwrap on Err: {self.error}")
    
    def unwrap_or(self, default: T) -> T:
        return default


Result = Union[Ok[T], Err[E]]


def is_ok(result: Result[T, E]) -> bool:
    return isinstance(result, Ok)


def is_err(result: Result[T, E]) -> bool:
    return isinstance(result, Err)
