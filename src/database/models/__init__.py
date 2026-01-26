from .mapper import mapper_registry, SHARED_TABLES, REPORTS_TABLES

# Shared table definitions (managed by ocrdone-backend)
from .user_model import User, user_table  # noqa F401
from .organization_model import Organization, organization_table  # noqa F401
from .project_model import Project, project_table, project_members  # noqa F401

# Reports-specific table definitions (managed by reports-system)
# Note: log_mapper must be imported before task_mapper due to column_property dependency
from .log_mapper import Log, task_log_table  # noqa F401
from .task_mapper import Task, task_table  # noqa F401
from .event_mapper import Event, event_table  # noqa F401
from .availability_mapper import OfficeAvailability, office_availability_table  # noqa F401

__all__ = [
    # Registry and table sets
    "mapper_registry",
    "SHARED_TABLES",
    "REPORTS_TABLES",
    # Shared models
    "User",
    "user_table",
    "Organization",
    "organization_table",
    "Project",
    "project_table",
    "project_members",
    # Reports-specific models
    "Task",
    "task_table",
    "Log",
    "task_log_table",
    "Event",
    "event_table",
    "OfficeAvailability",
    "office_availability_table",
]
