"""Agregar columna punto_auscultacion a evaluations

Revision ID: g4b5c6d7e8f9
Revises: f3a4b5c6d7e8
Create Date: 2026-06-25 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = 'g4b5c6d7e8f9'
down_revision = 'f3a4b5c6d7e8'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('evaluations', sa.Column('punto_auscultacion', sa.String(length=100), nullable=True))


def downgrade():
    op.drop_column('evaluations', 'punto_auscultacion')
