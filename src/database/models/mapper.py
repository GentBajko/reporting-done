from sqlalchemy.orm import registry

mapper_registry = registry()

# Shared tables (DO NOT MIGRATE - managed by ocrdone-backend)
# These tables exist in the shared database and their schema is controlled
# by ocrdone-backend's Alembic migrations. Reports-system only reads/writes
# to these tables but never modifies their structure.
SHARED_TABLES = {
    "users",
    "organizations",
    "projects",
    "project_members",
    "oauth_states",
    "files",
}

# Reports-specific tables (MIGRATE these)
# These tables are owned by reports-system and their schema is controlled
# by reports-system's Alembic migrations.
REPORTS_TABLES = {
    "tasks",
    "task_logs",
    "events",
    "office_availability",
}
