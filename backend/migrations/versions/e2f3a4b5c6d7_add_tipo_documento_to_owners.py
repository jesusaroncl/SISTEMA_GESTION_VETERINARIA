"""Añadir tipo_documento a owners y ampliar dni a 20 caracteres

Revision ID: e2f3a4b5c6d7
Revises: d1e2f3a4b5c6
Create Date: 2026-06-25 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'e2f3a4b5c6d7'
down_revision = 'd1e2f3a4b5c6'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('owners', sa.Column('tipo_documento', sa.String(length=50), nullable=True))
    op.execute("UPDATE owners SET tipo_documento = 'DNI' WHERE tipo_documento IS NULL")
    op.alter_column('owners', 'tipo_documento', nullable=False)
    op.alter_column('owners', 'dni', type_=sa.String(length=20))


def downgrade():
    op.alter_column('owners', 'dni', type_=sa.String(length=8))
    op.drop_column('owners', 'tipo_documento')
