from sqlalchemy import MetaData, create_engine
from alembic import context

from config.env import ENV
from database.models.mapper import mapper_registry, SHARED_TABLES

# Import all model modules to populate registry
from database.models.task_mapper import *  # noqa
from database.models.log_mapper import *  # noqa
from database.models.event_mapper import *  # noqa
from database.models.availability_mapper import *  # noqa

# Also import shared models (for relationships) but DON'T migrate them
from database.models.user_model import *  # noqa
from database.models.organization_model import *  # noqa
from database.models.project_model import *  # noqa

engine = create_engine(ENV.database_url)

# Filter out shared tables - they're managed by ocrdone-backend
target_metadata = MetaData()
for table in mapper_registry.metadata.tables.values():
    if table.name not in SHARED_TABLES:
        print(f"Including table {table.name} in migrations")
        table.tometadata(target_metadata)
    else:
        print(f"Skipping shared table {table.name} (managed by ocrdone-backend)")


def run_migrations_online() -> None:
    connectable = engine
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            include_object=lambda obj, name, type_, reflected, compare_to: (
                name not in SHARED_TABLES if type_ == "table" else True
            ),
        )
        with context.begin_transaction():
            context.run_migrations()


run_migrations_online()
