from enum import Flag, auto


class Permissions(Flag):
    """
    Granular permission system using bit flags for efficient
    access control and permission checking.
    """

    NONE = 0
    VIEW = auto()
    EDIT = auto()
    DELETE = auto()
    INVITE = auto()
    REMOVE_USERS = auto()
    MANAGE_BILLING = auto()
    VIEW_ANALYTICS = auto()
    MANAGE_ROLES = auto()
    MANAGE_ORGANIZATION = auto()

    VIEW_ONLY = VIEW
    STANDARD = VIEW | EDIT
    MANAGE = VIEW | EDIT | DELETE | INVITE | REMOVE_USERS | VIEW_ANALYTICS
    ADMIN = MANAGE | MANAGE_ROLES | MANAGE_BILLING
    ALL = ~NONE

    def has_permission(self, permission: "Permissions") -> bool:
        return self & permission == permission


class ProjectPermissions(Flag):
    """
    Project-specific permissions extending organization-wide
    access controls.
    """

    NONE = 0
    VIEW = auto()
    EDIT = auto()
    DELETE = auto()
    MANAGE_MEMBERS = auto()
    MANAGE_SETTINGS = auto()

    CONTRIBUTOR = VIEW | EDIT
    MAINTAINER = CONTRIBUTOR | MANAGE_MEMBERS
    PROJECT_ADMIN = ~NONE
