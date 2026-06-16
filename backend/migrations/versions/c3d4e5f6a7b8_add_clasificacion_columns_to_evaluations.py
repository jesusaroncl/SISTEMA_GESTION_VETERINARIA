"""Añadir columnas de clasificación a evaluations (categoria, grado_levine, descripcion_grado)

Revision ID: c3d4e5f6a7b8
Revises: 6b92a097316f
Create Date: 2026-06-16 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c3d4e5f6a7b8'
down_revision = '6b92a097316f'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('evaluations', sa.Column('categoria', sa.String(length=50), nullable=True))
    op.add_column('evaluations', sa.Column('grado_levine', sa.String(length=20), nullable=True))
    op.add_column('evaluations', sa.Column('descripcion_grado', sa.Text(), nullable=True))


def downgrade():
    op.drop_column('evaluations', 'descripcion_grado')
    op.drop_column('evaluations', 'grado_levine')
    op.drop_column('evaluations', 'categoria')
