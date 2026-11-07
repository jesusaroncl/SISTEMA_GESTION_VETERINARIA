"""
Usuarios y clínicas de prueba — Sistema de Gestión Veterinaria

Uso (local):      docker exec veterinaria_backend python3 seed_users.py
Uso (producción): docker exec veterinaria_prod_backend python3 seed_users.py

Crea dos clínicas y un usuario por rol, más un veterinario que trabaja en
ambas clínicas (para probar el selector de clínica). Se puede ejecutar varias
veces: lo que ya existe no se duplica y NUNCA cambia contraseñas existentes.

Contraseña de todos los usuarios: Demo#2026 (o la variable SEED_PASSWORD).
"""
import os
from app import create_app, db
from app.models import Clinic, User, ClinicMembership

PASSWORD = os.environ.get("SEED_PASSWORD", "Demo#2026")

CLINICS = [
    {"ruc": "20123456789", "nombre": "Clínica Demo"},
    {"ruc": "20987654321", "nombre": "Clínica Norte"},
]

# (usuario, correo, [(ruc de la clínica, rol), ...])
USERS = [
    ("admin_demo", "admin_demo@demo.local", [("20123456789", "administrador")]),
    ("vet_demo", "vet_demo@demo.local", [("20123456789", "veterinario")]),
    ("asistente_demo", "asistente_demo@demo.local", [("20123456789", "asistente")]),
    ("admin_norte", "admin_norte@demo.local", [("20987654321", "administrador")]),
    ("vet_multi", "vet_multi@demo.local", [("20123456789", "veterinario"), ("20987654321", "veterinario")]),
]


def seed():
    app = create_app()
    with app.app_context():
        clinics = {}
        for c in CLINICS:
            clinic = db.session.execute(db.select(Clinic).filter_by(ruc=c["ruc"])).scalar_one_or_none()
            if not clinic:
                clinic = Clinic(nombre=c["nombre"], ruc=c["ruc"])
                db.session.add(clinic)
                db.session.flush()
                print(f"  + {c['nombre']} (RUC {c['ruc']})")
            clinics[c["ruc"]] = clinic

        for username, email, memberships in USERS:
            user = db.session.execute(db.select(User).filter_by(username=username)).scalar_one_or_none()
            if not user:
                if db.session.execute(db.select(User.id).filter_by(email=email)).first():
                    print(f"  ! {username}: el correo {email} ya lo usa otra cuenta, se omite")
                    continue
                user = User(username=username, email=email)
                user.set_password(PASSWORD)
                db.session.add(user)
                db.session.flush()
                print(f"  + Usuario {username}")
            for ruc, role in memberships:
                clinic = clinics[ruc]
                exists = db.session.execute(
                    db.select(ClinicMembership).filter_by(user_id=user.id, clinic_id=clinic.id)
                ).scalar_one_or_none()
                if not exists:
                    db.session.add(ClinicMembership(user_id=user.id, clinic_id=clinic.id, role=role))
                    print(f"    · {username} → {clinic.nombre} ({role})")

        db.session.commit()
        print("\nUsuarios de prueba listos. Contraseña de todos:", "(SEED_PASSWORD)" if "SEED_PASSWORD" in os.environ else PASSWORD)
        for username, _, memberships in USERS:
            print(f"  {username:<16} " + ", ".join(f"{role} en {clinics[ruc].nombre}" for ruc, role in memberships))


if __name__ == "__main__":
    seed()
