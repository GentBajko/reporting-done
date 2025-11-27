from typing import TypeVar, Protocol, Generic, runtime_checkable
from backend.types.result import Result

T = TypeVar("T")
E = TypeVar("E")


@runtime_checkable
class IValidator(Protocol[T, E]):
    def validate(self, data: T) -> Result[T, E]: ...


@runtime_checkable
class IPasswordHasher(Protocol):
    def hash(self, password: str) -> str: ...
    
    def verify(self, password: str, hashed: str) -> bool: ...
    
    def needs_rehash(self, hashed: str) -> bool: ...


@runtime_checkable
class ITokenProvider(Protocol):
    def generate(self, payload: dict[str, str | int]) -> str: ...
    
    def decode(self, token: str) -> Result[dict[str, str | int], str]: ...
    
    def is_valid(self, token: str) -> bool: ...

