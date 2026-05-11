"""add starts_at and cutoff_at to events

Revision ID: b369d1f32b87
Revises: a1b2c3d4e5f6
Create Date: 2026-05-11 19:25:33.345254+09:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b369d1f32b87'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add networking-session time-window columns to events.

    starts_at and cutoff_at let the BE enforce the 45min cutoff
    server-side (AMB-015) and let the FE compute a drift-aware
    countdown (AMB-016). Both are nullable so existing event rows
    keep working without backfill.
    """
    op.add_column(
        'events',
        sa.Column('starts_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        'events',
        sa.Column('cutoff_at', sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column('events', 'cutoff_at')
    op.drop_column('events', 'starts_at')
