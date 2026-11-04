"""add email to users

Revision ID: i6d7e8f9a0b1
Revises: h5c6d7e8f9a0
Create Date: 2026-09-21

"""
from alembic import op
import sqlalchemy as sa

revision = 'i6d7e8f9a0b1'
down_revision = 'h5c6d7e8f9a0'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('users', sa.Column('email', sa.String(length=120), nullable=True))
    op.create_unique_constraint('uq_users_email', 'users', ['email'])
    op.add_column('users', sa.Column('reset_code_hash', sa.String(length=64), nullable=True))
    op.add_column('users', sa.Column('reset_code_expires', sa.DateTime(), nullable=True))
    op.add_column('users', sa.Column('reset_code_attempts', sa.Integer(), nullable=False, server_default='0'))


def downgrade():
    op.drop_column('users', 'reset_code_attempts')
    op.drop_column('users', 'reset_code_expires')
    op.drop_column('users', 'reset_code_hash')
    op.drop_constraint('uq_users_email', 'users', type_='unique')
    op.drop_column('users', 'email')
