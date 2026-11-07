"""multitenant: clinics, users.clinic_id, owners.clinic_id, rol administrador

Revision ID: j7e8f9a0b1c2
Revises: i6d7e8f9a0b1
Create Date: 2026-09-21

"""
from alembic import op
import sqlalchemy as sa

revision = 'j7e8f9a0b1c2'
down_revision = 'i6d7e8f9a0b1'
branch_labels = None
depends_on = None


def upgrade():
    # Nuevo valor del enum (debe confirmarse fuera de la transacción de la migración)
    with op.get_context().autocommit_block():
        op.execute("ALTER TYPE user_roles ADD VALUE IF NOT EXISTS 'administrador'")

    op.create_table(
        'clinics',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('nombre', sa.String(length=150), nullable=False),
        sa.Column('ruc', sa.String(length=11), nullable=False, unique=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    op.add_column('users', sa.Column('clinic_id', sa.Integer(), nullable=True))
    op.add_column('owners', sa.Column('clinic_id', sa.Integer(), nullable=True))

    # Los datos existentes pasan a una clínica por defecto (editar nombre/RUC luego)
    bind = op.get_bind()
    has_data = bind.execute(sa.text("SELECT (SELECT COUNT(*) FROM users) + (SELECT COUNT(*) FROM owners)")).scalar()
    if has_data:
        clinic_id = bind.execute(sa.text(
            "INSERT INTO clinics (nombre, ruc) VALUES ('Clínica Principal', '00000000000') RETURNING id"
        )).scalar()
        bind.execute(sa.text("UPDATE users SET clinic_id = :c"), {"c": clinic_id})
        bind.execute(sa.text("UPDATE owners SET clinic_id = :c"), {"c": clinic_id})

    op.alter_column('users', 'clinic_id', nullable=False)
    op.alter_column('owners', 'clinic_id', nullable=False)
    op.create_foreign_key('fk_users_clinic', 'users', 'clinics', ['clinic_id'], ['id'])
    op.create_foreign_key('fk_owners_clinic', 'owners', 'clinics', ['clinic_id'], ['id'])

    # DNI y correo dejan de ser únicos globales: ahora son únicos por clínica
    op.execute("ALTER TABLE owners DROP CONSTRAINT IF EXISTS owners_dni_key")
    op.execute("ALTER TABLE owners DROP CONSTRAINT IF EXISTS owners_correo_key")
    op.create_unique_constraint('uq_owners_clinic_dni', 'owners', ['clinic_id', 'dni'])
    op.create_unique_constraint('uq_owners_clinic_correo', 'owners', ['clinic_id', 'correo'])


def downgrade():
    op.drop_constraint('uq_owners_clinic_correo', 'owners', type_='unique')
    op.drop_constraint('uq_owners_clinic_dni', 'owners', type_='unique')
    op.create_unique_constraint('owners_dni_key', 'owners', ['dni'])
    op.create_unique_constraint('owners_correo_key', 'owners', ['correo'])
    op.drop_constraint('fk_owners_clinic', 'owners', type_='foreignkey')
    op.drop_constraint('fk_users_clinic', 'users', type_='foreignkey')
    op.drop_column('owners', 'clinic_id')
    op.drop_column('users', 'clinic_id')
    op.drop_table('clinics')
