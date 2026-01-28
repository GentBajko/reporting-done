from enum import Flag
from typing import Union, List, Dict


class FlagBase(Flag):
    """
    Enhanced Flag base class with generic type support for proper type inheritance.
    Provides rich functionality for flag manipulation and representation with
    type-safe operations across all methods.
    """

    def __str__(self) -> str:
        """Returns a human-readable string representation with spaces instead of underscores."""
        if self.name:
            return self.name.replace("_", " ").title()
        return ""

    @property
    def name(self) -> str:
        """Returns the capitalized name of the flag."""
        return str(self._name_).title()

    @property
    def value(self) -> int:
        """Returns the underlying integer value of the flag."""
        return self._value_

    def array(self) -> List[str]:
        """Splits compound flags into an array of individual flag names."""
        return self.__str__().split("|")

    def verbose_array(self) -> List[str]:
        """
        Returns a comprehensive list of active flags as human-readable strings.
        More detailed than array() as it includes full flag representations.
        """
        return [str(flag) for flag in self.__class__ if flag in self]

    def from_string(self, string: str):
        """
        Converts a string representation back into a flag instance.

        Args:
            string: The string representation of the flag

        Returns:
            An instance of the child class containing the specified flag
        """
        return self.__class__[string.upper().replace(" ", "_")]

    def as_dict(self) -> Dict[str, int]:
        """
        Creates a dictionary mapping of active flag names to their values.
        Useful for serialization and API responses.
        """
        return {
            flag.name: flag.value for flag in self.__class__ if flag in self
        }

    def to_type(self) -> Dict[str, str]:
        """
        Returns a type classification dictionary for the flag.
        Useful for type-based filtering and categorization.
        """
        return {
            "item": self.name,
            "item_type": self.__class__.__name__.replace("Flags", "").lower(),
        }

    @classmethod
    def get(cls, item: Union[int, str]):
        """
        Creates a flag instance from either an integer value or string representation.

        Args:
            item: Either an integer bitmask or a string representation of the flag(s)

        Returns:
            An instance of the child class containing the specified flag(s)
        """
        if isinstance(item, int):
            return cls(item)
        if "|" not in item:
            return cls[item.upper()]
        items = item.split("|")
        value = [cls[item.upper()] for item in items]
        output = value.pop()
        for i in value:
            output |= i
        return output

    @classmethod
    def all_members(cls):
        """Returns a list of all possible flag values for the class."""
        return [flag for flag in cls]

    @classmethod
    def all_members_string(cls) -> List[str]:
        """Returns a list of string representations of all possible flag values."""
        return [str(flag) for flag in cls]
