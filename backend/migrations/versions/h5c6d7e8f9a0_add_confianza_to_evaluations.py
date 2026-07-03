"""add confianza_modelo to evaluations

Revision ID: h5c6d7e8f9a0
Revises: g4b5c6d7e8f9
Create Date: 2026-07-03

"""
from alembic import op
import sqlalchemy as sa

revision = 'h5c6d7e8f9a0'
down_revision = 'g4b5c6d7e8f9'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('evaluations', sa.Column('confianza_modelo', sa.Float(), nullable=True))


def downgrade():
    op.drop_column('evaluations', 'confianza_modelo')
