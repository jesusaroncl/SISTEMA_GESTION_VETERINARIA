"""multiclínica: membresías (usuario <-> clínica con rol) e invitaciones por correo

Revision ID: k8f9a0b1c2d3
Revises: j7e8f9a0b1c2
Create Date: 2026-11-04

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = 'k8f9a0b1c2d3'
down_revision = 'j7e8f9a0b1c2'
branch_labels = None
depends_on = None

# El enum user_roles ya existe (creado con la tabla users)
user_roles = postgresql.ENUM('administrador', 'asistente', 'veterinario', name='user_roles', create_type=False)


def upgrade():
    op.create_table(
        'clinic_memberships',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('clinic_id', sa.Integer(), sa.ForeignKey('clinics.id', ondelete='CASCADE'), nullable=False),
        sa.Column('role', user_roles, nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint('user_id', 'clinic_id', name='uq_membership_user_clinic'),
    )

    # Cada usuario existente pasa a ser miembro de su clínica actual con su rol actual
    op.execute(
        "INSERT INTO clinic_memberships (user_id, clinic_id, role) "
        "SELECT id, clinic_id, role FROM users"
    )

    op.create_table(
        'clinic_invitations',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('clinic_id', sa.Integer(), sa.ForeignKey('clinics.id', ondelete='CASCADE'), nullable=False),
        sa.Column('email', sa.String(length=120), nullable=False),
        sa.Column('role', user_roles, nullable=False),
        sa.Column('token_hash', sa.String(length=64), nullable=False, unique=True),
        sa.Column('invited_by', sa.Integer(), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('accepted_at', sa.DateTime(), nullable=True),
    )
    op.create_index('ix_invitations_clinic_email', 'clinic_invitations', ['clinic_id', 'email'])

    # La clínica y el rol ya no viven en users
    op.drop_constraint('fk_users_clinic', 'users', type_='foreignkey')
    op.drop_column('users', 'clinic_id')
    op.drop_column('users', 'role')


def downgrade():
    op.add_column('users', sa.Column('role', user_roles, nullable=True))
    op.add_column('users', sa.Column('clinic_id', sa.Integer(), nullable=True))
    # Si un usuario está en varias clínicas, se conserva la membresía más antigua
    op.execute(
        "UPDATE users u SET clinic_id = m.clinic_id, role = m.role FROM ("
        "  SELECT DISTINCT ON (user_id) user_id, clinic_id, role FROM clinic_memberships ORDER BY user_id, id"
        ") m WHERE m.user_id = u.id"
    )
    op.execute("DELETE FROM users WHERE clinic_id IS NULL")
    op.alter_column('users', 'role', nullable=False)
    op.alter_column('users', 'clinic_id', nullable=False)
    op.create_foreign_key('fk_users_clinic', 'users', 'clinics', ['clinic_id'], ['id'])

    op.drop_index('ix_invitations_clinic_email', table_name='clinic_invitations')
    op.drop_table('clinic_invitations')
    op.drop_table('clinic_memberships')
