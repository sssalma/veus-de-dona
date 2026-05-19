"""update coordenades parada enum

Revision ID: 384a32aacdbb
Revises: 41bf3689e0ea
Create Date: 2026-05-19 16:01:56.876750

"""
from typing import Sequence, Union

from alembic import op
from sqlalchemy.dialects import postgresql
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '384a32aacdbb'
down_revision: Union[str, Sequence[str], None] = '41bf3689e0ea'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # step 1: clear parada table to avoid constraint conflicts
    op.execute('DELETE FROM "like"')
    op.execute("DELETE FROM visita")
    op.execute("DELETE FROM comentari")
    op.execute("DELETE FROM recurs")
    op.execute("DELETE FROM text")
    op.execute("DELETE FROM parada")

    # step 2: drop column using old enum
    op.drop_column('parada', 'coordenades')

    # step 3: drop old enum type
    op.execute("DROP TYPE IF EXISTS coordenadesparada")

    # step 4: create new enum with correct values
    new_enum = postgresql.ENUM(
        'BALCO_MEDITERRANI',
        'AMFITEATRE',
        'BAIXADA_PEIXATERIA',
        'PLACA_REI',
        'PLACA_ANGELS',
        'PLACA_FORUM',
        'CARRER_CALDERERS',
        'PLA_SEU',
        'CARRER_MAJOR',
        'PLACA_FONT',
        name='coordenadesparada'
    )
    new_enum.create(op.get_bind())

    # step 5: add column back with new enum
    op.execute("""
        ALTER TABLE parada
        ADD COLUMN coordenades coordenadesparada NOT NULL
        DEFAULT 'BALCO_MEDITERRANI'
    """)

    # step 6: remove default (default was only needed for NOT NULL constraint)
    op.execute("""
        ALTER TABLE parada
        ALTER COLUMN coordenades DROP DEFAULT
    """)


def downgrade() -> None:
    # reverse: restore old enum
    op.execute("DELETE FROM parada")
    op.drop_column('parada', 'coordenades')
    op.execute("DROP TYPE IF EXISTS coordenadesparada")

    old_enum = postgresql.ENUM(
        'BALCO_MEDITERRANI', 'AMFITEATRE_ROMA', 'PL_FONT',
        'PL_SEDASSOS', 'ESCALES_CATEDRAL', 'C_CAVALLERS',
        'PORTAL_ROSER', 'C_DAMES', 'PL_PALLOL', 'C_SANT_LLORENC',
        name='coordenadesparada'
    )
    old_enum.create(op.get_bind())

    op.execute("""
        ALTER TABLE parada
        ADD COLUMN coordenades coordenadesparada NOT NULL
        DEFAULT 'BALCO_MEDITERRANI'
    """)
    op.execute("ALTER TABLE parada ALTER COLUMN coordenades DROP DEFAULT")