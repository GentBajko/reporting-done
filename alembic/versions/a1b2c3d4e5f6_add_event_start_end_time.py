"""add_event_start_end_time

Revision ID: a1b2c3d4e5f6
Revises: 3df1c98af0e0
Create Date: 2025-11-26 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '3df1c98af0e0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('event', sa.Column('start_time', sa.String(length=5), nullable=True))
    op.add_column('event', sa.Column('end_time', sa.String(length=5), nullable=True))


def downgrade() -> None:
    op.drop_column('event', 'end_time')
    op.drop_column('event', 'start_time')

