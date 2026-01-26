from enum import IntEnum

from core.enums.permissions import Permissions


class Roles(IntEnum):
    """
    Core user roles with associated default permissions.
    Enables standardized access patterns across the organization.
    """

    VIEWER = 1
    EDITOR = 2
    ADMIN = 3
    OWNER = 4

    @property
    def permissions(self) -> "Permissions":
        return {
            Roles.VIEWER: Permissions.VIEW,
            Roles.EDITOR: Permissions.VIEW | Permissions.EDIT,
            Roles.ADMIN: Permissions.VIEW
            | Permissions.EDIT
            | Permissions.MANAGE,
            Roles.OWNER: Permissions.ALL,
        }[self]
