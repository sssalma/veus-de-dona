"""add text_traduccio

Revision ID: b4d2c7e91a05
Revises: 6601375028bc
Create Date: 2026-08-31 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'b4d2c7e91a05'
down_revision: Union[str, Sequence[str], None] = '6601375028bc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # El tipus `idioma` ja existeix des de la migracio inicial, per a
    # usuari.idioma. Com a autora_traduccio, cal create_type=False perque
    # aquesta migracio no provi de tornar-lo a crear.
    idioma = postgresql.ENUM('CA', 'ES', 'EN', name='idioma', create_type=False)

    op.create_table(
        'text_traduccio',
        sa.Column('text_id', sa.UUID(), nullable=False),
        sa.Column('idioma', idioma, nullable=False),
        sa.Column('titol', sa.String(), nullable=False),
        sa.Column('contingut', sa.Text(), nullable=False),
        sa.ForeignKeyConstraint(['text_id'], ['text.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('text_id', 'idioma'),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('text_traduccio')
