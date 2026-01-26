from enum import Enum, Flag, auto

from core.enums.flags import FlagBase


class UserStatus(FlagBase):
    ACTIVE = auto()
    INACTIVE = auto()
    SUSPENDED = auto()
    INVITED = auto()
    DELETED = auto()
    PENDING = INVITED | INACTIVE
    RESTRICTED = SUSPENDED | INACTIVE


class OrganizationStatus(Flag):
    ACTIVE = auto()
    SUSPENDED = auto()
    ARCHIVED = auto()
    TRIAL = auto()
    DELETED = auto()


class ProjectStatus(Flag):
    DRAFT = auto()
    ACTIVE = auto()
    ARCHIVED = auto()
    FROZEN = auto()
    DELETED = auto()
    RESTRICTED = FROZEN | ARCHIVED
    MAINTAINABLE = ACTIVE | FROZEN


class FileStatus(Enum):
    QUEUED = "queued"
    PROCESSING = "processing"
    READY = "ready"
    FAILED = "failed"
    DELETED = "deleted"
