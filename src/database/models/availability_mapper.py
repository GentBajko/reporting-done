from sqlalchemy import Date, Table, Column, String, Boolean, ForeignKey

from database.models.mapper import mapper_registry
from core.models.office_availability import (
    OfficeAvailability,  # Updated import
)

office_availability_table = Table(  # Renamed table variable
    "office_availability",  # Renamed table
    mapper_registry.metadata,
    Column("id", String(26), primary_key=True),
    Column("user_id", String(26), ForeignKey("user.id"), nullable=False),
    Column("day", Date, nullable=False),
    Column(
        "present", Boolean, nullable=True, default=False
    ),  # Field 'present' seems correct for OfficeAvailability
)

mapper_registry.map_imperatively(
    OfficeAvailability, office_availability_table
)  # Updated class and table variable
