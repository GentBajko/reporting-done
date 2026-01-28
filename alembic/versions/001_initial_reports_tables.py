"""Initial reports tables

Revision ID: 001_initial
Revises:
Create Date: 2024-01-01 00:00:00.000000

This migration creates the reports-specific tables. It assumes the shared tables
(users, organizations, projects) already exist in the database, created by ocrdone-backend.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Tasks table
    op.create_table(
        "tasks",
        sa.Column("id", sa.String(26), primary_key=True),
        sa.Column(
            "project_id", sa.String(26), sa.ForeignKey("projects.id"), nullable=False
        ),
        sa.Column("project_name", sa.String(100), nullable=False),
        sa.Column(
            "user_id", sa.String(26), sa.ForeignKey("users.id"), nullable=False
        ),
        sa.Column("user_name", sa.String(100), nullable=False),
        sa.Column("title", sa.String(100), nullable=False),
        sa.Column("hours_required", sa.Float, nullable=False),
        sa.Column("description", sa.String(255), nullable=True),
        sa.Column("status", sa.String(50), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("hours_worked", sa.Float, nullable=False, server_default="0.0"),
        sa.Column("returned", sa.Boolean, nullable=True, server_default="false"),
    )

    # Task logs table
    op.create_table(
        "task_logs",
        sa.Column("id", sa.String(26), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "task_id",
            sa.String(26),
            sa.ForeignKey("tasks.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("task_name", sa.String(100), nullable=False),
        sa.Column("description", sa.String(255), nullable=True),
        sa.Column(
            "user_id", sa.String(26), sa.ForeignKey("users.id"), nullable=False
        ),
        sa.Column("user_name", sa.String(50), nullable=False),
        sa.Column(
            "project_id", sa.String(26), sa.ForeignKey("projects.id"), nullable=False
        ),
        sa.Column("project_name", sa.String(100), nullable=False),
        sa.Column("hours_spent", sa.Float, nullable=False, server_default="0.0"),
        sa.Column("task_status", sa.String(50), nullable=False),
    )

    # Events table
    op.create_table(
        "events",
        sa.Column("id", sa.String(26), primary_key=True),
        sa.Column(
            "user_id",
            sa.String(26),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.String(1000), nullable=True),
        sa.Column("event_type", sa.String(50), nullable=False),
        sa.Column("event_date", sa.Date, nullable=False),
        sa.Column("start_time", sa.Time, nullable=True),
        sa.Column("end_time", sa.Time, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

    # Office availability table
    op.create_table(
        "office_availability",
        sa.Column("id", sa.String(26), primary_key=True),
        sa.Column(
            "user_id",
            sa.String(26),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("day", sa.Date, nullable=False),
        sa.Column("present", sa.Boolean, nullable=True, server_default="false"),
    )


def downgrade() -> None:
    op.drop_table("office_availability")
    op.drop_table("events")
    op.drop_table("task_logs")
    op.drop_table("tasks")
