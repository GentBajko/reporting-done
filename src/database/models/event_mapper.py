from sqlalchemy import Table, Column, String, BigInteger, ForeignKey
from sqlalchemy.orm import relationship

from core.models.event import Event
from database.models.mapper import mapper_registry

event_table = Table(
    "event",
    mapper_registry.metadata,
    Column("id", String(26), primary_key=True),
    Column("user_id", String(26), ForeignKey("user.id"), nullable=False),
    Column("title", String(255), nullable=False),
    Column("description", String(1000), nullable=True),
    Column("event_type", String(50), nullable=False),
    Column("event_date", BigInteger, nullable=False),
    Column("created_at", BigInteger, nullable=False),
)

mapper_registry.map_imperatively(
    Event,
    event_table,
    properties={
        "user": relationship(
            "User",
            lazy="noload",
        ),
    },
)

