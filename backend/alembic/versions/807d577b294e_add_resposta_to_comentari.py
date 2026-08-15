"""add resposta to comentari

Revision ID: 807d577b294e
Revises: 1fb1fef21dbf
Create Date: 2026-07-25 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '807d577b294e'
down_revision: Union[str, Sequence[str], None] = '1fb1fef21dbf'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('comentari', sa.Column('resposta_editor', sa.String(), nullable=True))
    op.add_column('comentari', sa.Column('resposta_data', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('comentari', 'resposta_data')
    op.drop_column('comentari', 'resposta_editor')
