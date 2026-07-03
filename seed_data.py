"""
Script de datos de muestra — Sistema de Gestión Veterinaria
Uso:
  docker cp seed_data.py veterinaria_backend:/usr/src/app/seed_data.py
  docker exec veterinaria_backend python3 seed_data.py
"""
import datetime, uuid, sys
from app import create_app, db
from app.models import Owner, Dog, Evaluation

app = create_app()

# ── Grados disponibles ──────────────────────────────────────
GRADOS = [
    ("AUSENTE",  "Ausencia del soplo cardíaco"),
    ("I /VI",    "Soplo muy suave, solo audible en condiciones ideales"),
    ("II /VI",   "Soplo suave pero fácilmente audible"),
    ("III /VI",  "Si es moderadamente intenso o intenso."),
]
PUNTOS = ["PV", "TV", "AV", "MV", "Phc"]

# ── Propietarios ────────────────────────────────────────────
owners_data = [
    {"nombres": "Carlos Alberto",  "apellidos": "Quispe Mamani",    "dni": "41256789", "celular": "987654321", "correo": "carlos.quispe@gmail.com",      "direccion": "Av. Arequipa 1234",      "sexo": "Masculino", "fechaNacimiento": datetime.date(1985, 3, 12),  "departamento": "AREQUIPA",    "provincia": "AREQUIPA", "distrito": "AREQUIPA"},
    {"nombres": "María Elena",     "apellidos": "Torres Vargas",    "dni": "52387641", "celular": "965432187", "correo": "maria.torres@hotmail.com",     "direccion": "Jr. Huancavelica 456",   "sexo": "Femenino",  "fechaNacimiento": datetime.date(1990, 7, 25),  "departamento": "LIMA",        "provincia": "LIMA",     "distrito": "MIRAFLORES"},
    {"nombres": "Juan Pablo",      "apellidos": "Flores Huanca",    "dni": "63741852", "celular": "943218765", "correo": "juanpablo.flores@yahoo.com",   "direccion": "Calle Los Pinos 789",    "sexo": "Masculino", "fechaNacimiento": datetime.date(1978, 11, 8),  "departamento": "CUSCO",       "provincia": "CUSCO",    "distrito": "CUSCO"},
    {"nombres": "Lucía Fernanda",  "apellidos": "Ramos Chávez",    "dni": "74852963", "celular": "921567843", "correo": "lucia.ramos@gmail.com",        "direccion": "Psje. Las Flores 321",   "sexo": "Femenino",  "fechaNacimiento": datetime.date(1995, 2, 14),  "departamento": "LA LIBERTAD", "provincia": "TRUJILLO", "distrito": "TRUJILLO"},
    {"nombres": "Roberto Miguel",  "apellidos": "Sánchez Paredes",  "dni": "85963741", "celular": "912345678", "correo": "roberto.sanchez@gmail.com",    "direccion": "Av. Brasil 220",         "sexo": "Masculino", "fechaNacimiento": datetime.date(1982, 6, 3),   "departamento": "LIMA",        "provincia": "LIMA",     "distrito": "PUEBLO LIBRE"},
    {"nombres": "Ana Sofía",       "apellidos": "Mendoza Ríos",    "dni": "96174852", "celular": "934567890", "correo": "ana.mendoza@outlook.com",      "direccion": "Jr. Tacna 500",          "sexo": "Femenino",  "fechaNacimiento": datetime.date(1988, 9, 20),  "departamento": "LIMA",        "provincia": "LIMA",     "distrito": "LIMA"},
    {"nombres": "Pedro Alonso",    "apellidos": "Vega Castillo",    "dni": "10293847", "celular": "956781234", "correo": "pedro.vega@gmail.com",         "direccion": "Calle Real 88",          "sexo": "Masculino", "fechaNacimiento": datetime.date(1975, 4, 17),  "departamento": "JUNIN",       "provincia": "HUANCAYO", "distrito": "HUANCAYO"},
]

# ── Perros (owner_idx referencia la lista owners_data) ──────
dogs_data = [
    {"nombre": "Rocky",   "raza": "Labrador Retriever",  "sexo": "Macho",  "fechaNacimiento": datetime.date(2019, 5, 10), "owner_idx": 0},
    {"nombre": "Luna",    "raza": "Beagle",               "sexo": "Hembra", "fechaNacimiento": datetime.date(2020, 8, 3),  "owner_idx": 0},
    {"nombre": "Max",     "raza": "Golden Retriever",     "sexo": "Macho",  "fechaNacimiento": datetime.date(2015, 1, 20), "owner_idx": 1},
    {"nombre": "Bella",   "raza": "French Bulldog",       "sexo": "Hembra", "fechaNacimiento": datetime.date(2021, 4, 15), "owner_idx": 1},
    {"nombre": "Toby",    "raza": "Yorkshire Terrier",    "sexo": "Macho",  "fechaNacimiento": datetime.date(2014, 9, 7),  "owner_idx": 1},
    {"nombre": "Simba",   "raza": "Rottweiler",           "sexo": "Macho",  "fechaNacimiento": datetime.date(2013, 3, 22), "owner_idx": 2},
    {"nombre": "Nala",    "raza": "Poodle",               "sexo": "Hembra", "fechaNacimiento": datetime.date(2022, 6, 30), "owner_idx": 2},
    {"nombre": "Coco",    "raza": "Chihuahua",            "sexo": "Macho",  "fechaNacimiento": datetime.date(2017, 12, 1), "owner_idx": 3},
    {"nombre": "Mia",     "raza": "Shih Tzu",             "sexo": "Hembra", "fechaNacimiento": datetime.date(2016, 7, 18), "owner_idx": 3},
    {"nombre": "Thor",    "raza": "Golden Retriever",     "sexo": "Macho",  "fechaNacimiento": datetime.date(2014, 2, 14), "owner_idx": 4},
    {"nombre": "Kira",    "raza": "Labrador Retriever",   "sexo": "Hembra", "fechaNacimiento": datetime.date(2016, 11, 5), "owner_idx": 4},
    {"nombre": "Bruno",   "raza": "Beagle",               "sexo": "Macho",  "fechaNacimiento": datetime.date(2018, 3, 28), "owner_idx": 5},
    {"nombre": "Lola",    "raza": "Yorkshire Terrier",    "sexo": "Hembra", "fechaNacimiento": datetime.date(2013, 8, 12), "owner_idx": 5},
    {"nombre": "Duke",    "raza": "Rottweiler",           "sexo": "Macho",  "fechaNacimiento": datetime.date(2012, 6, 9),  "owner_idx": 6},
    {"nombre": "Canela",  "raza": "Poodle",               "sexo": "Hembra", "fechaNacimiento": datetime.date(2020, 1, 22), "owner_idx": 6},
]

# ── Evaluaciones ─────────────────────────────────────────────
# Históricas (antes de las últimas 10 semanas)
evals_historicas = [
    {"dog_idx": 0,  "grado": 0, "punto": "PV",  "fecha": datetime.date(2024, 3, 10),  "conf": 0.912},
    {"dog_idx": 0,  "grado": 1, "punto": "AV",  "fecha": datetime.date(2024, 11, 5),  "conf": 0.781},
    {"dog_idx": 1,  "grado": 0, "punto": "MV",  "fecha": datetime.date(2024, 6, 20),  "conf": 0.948},
    {"dog_idx": 2,  "grado": 2, "punto": "TV",  "fecha": datetime.date(2023, 9, 14),  "conf": 0.763},
    {"dog_idx": 2,  "grado": 3, "punto": "AV",  "fecha": datetime.date(2025, 1, 8),   "conf": 0.834},
    {"dog_idx": 3,  "grado": 0, "punto": "PV",  "fecha": datetime.date(2024, 4, 2),   "conf": 0.921},
    {"dog_idx": 4,  "grado": 2, "punto": "MV",  "fecha": datetime.date(2024, 8, 19),  "conf": 0.747},
    {"dog_idx": 4,  "grado": 3, "punto": "Phc", "fecha": datetime.date(2025, 2, 14),  "conf": 0.869},
    {"dog_idx": 5,  "grado": 1, "punto": "TV",  "fecha": datetime.date(2024, 5, 30),  "conf": 0.802},
    {"dog_idx": 6,  "grado": 0, "punto": "PV",  "fecha": datetime.date(2025, 3, 7),   "conf": 0.935},
    {"dog_idx": 7,  "grado": 1, "punto": "MV",  "fecha": datetime.date(2024, 10, 22), "conf": 0.778},
    {"dog_idx": 7,  "grado": 2, "punto": "AV",  "fecha": datetime.date(2025, 4, 1),   "conf": 0.756},
    {"dog_idx": 8,  "grado": 0, "punto": "TV",  "fecha": datetime.date(2025, 5, 15),  "conf": 0.906},
    {"dog_idx": 9,  "grado": 3, "punto": "AV",  "fecha": datetime.date(2024, 7, 11),  "conf": 0.841},
    {"dog_idx": 10, "grado": 2, "punto": "PV",  "fecha": datetime.date(2024, 12, 3),  "conf": 0.773},
    {"dog_idx": 11, "grado": 0, "punto": "MV",  "fecha": datetime.date(2025, 1, 20),  "conf": 0.957},
    {"dog_idx": 12, "grado": 3, "punto": "TV",  "fecha": datetime.date(2024, 9, 18),  "conf": 0.812},
    {"dog_idx": 13, "grado": 3, "punto": "AV",  "fecha": datetime.date(2024, 6, 5),   "conf": 0.887},
    {"dog_idx": 14, "grado": 0, "punto": "PV",  "fecha": datetime.date(2025, 2, 28),  "conf": 0.943},
]

# Recientes — últimas 10 semanas (2026-04-27 → 2026-07-03)
# Semana 18: 2026-04-27
# Semana 19: 2026-05-04
# ...
# Semana 27: 2026-06-29
evals_recientes = [
    # Semana 18 (2026-04-28)
    {"dog_idx": 9,  "grado": 3, "punto": "AV",  "fecha": datetime.date(2026, 4, 28),  "conf": 0.856},
    {"dog_idx": 5,  "grado": 2, "punto": "MV",  "fecha": datetime.date(2026, 4, 29),  "conf": 0.743},
    {"dog_idx": 13, "grado": 3, "punto": "TV",  "fecha": datetime.date(2026, 4, 30),  "conf": 0.891},
    # Semana 19 (2026-05-04)
    {"dog_idx": 0,  "grado": 0, "punto": "PV",  "fecha": datetime.date(2026, 5, 5),   "conf": 0.934},
    {"dog_idx": 10, "grado": 2, "punto": "AV",  "fecha": datetime.date(2026, 5, 6),   "conf": 0.768},
    {"dog_idx": 4,  "grado": 3, "punto": "MV",  "fecha": datetime.date(2026, 5, 7),   "conf": 0.823},
    {"dog_idx": 12, "grado": 1, "punto": "TV",  "fecha": datetime.date(2026, 5, 7),   "conf": 0.794},
    # Semana 20 (2026-05-12)
    {"dog_idx": 3,  "grado": 0, "punto": "PV",  "fecha": datetime.date(2026, 5, 12),  "conf": 0.918},
    {"dog_idx": 7,  "grado": 1, "punto": "Phc", "fecha": datetime.date(2026, 5, 13),  "conf": 0.762},
    {"dog_idx": 14, "grado": 0, "punto": "AV",  "fecha": datetime.date(2026, 5, 14),  "conf": 0.951},
    # Semana 21 (2026-05-19)
    {"dog_idx": 2,  "grado": 2, "punto": "TV",  "fecha": datetime.date(2026, 5, 19),  "conf": 0.779},
    {"dog_idx": 5,  "grado": 3, "punto": "MV",  "fecha": datetime.date(2026, 5, 20),  "conf": 0.847},
    {"dog_idx": 11, "grado": 0, "punto": "PV",  "fecha": datetime.date(2026, 5, 21),  "conf": 0.963},
    {"dog_idx": 8,  "grado": 2, "punto": "AV",  "fecha": datetime.date(2026, 5, 22),  "conf": 0.741},
    # Semana 22 (2026-05-26)
    {"dog_idx": 9,  "grado": 3, "punto": "TV",  "fecha": datetime.date(2026, 5, 27),  "conf": 0.872},
    {"dog_idx": 1,  "grado": 0, "punto": "PV",  "fecha": datetime.date(2026, 5, 27),  "conf": 0.929},
    {"dog_idx": 13, "grado": 2, "punto": "MV",  "fecha": datetime.date(2026, 5, 28),  "conf": 0.756},
    # Semana 23 (2026-06-02)
    {"dog_idx": 6,  "grado": 0, "punto": "AV",  "fecha": datetime.date(2026, 6, 2),   "conf": 0.944},
    {"dog_idx": 4,  "grado": 3, "punto": "Phc", "fecha": datetime.date(2026, 6, 3),   "conf": 0.835},
    {"dog_idx": 10, "grado": 1, "punto": "TV",  "fecha": datetime.date(2026, 6, 4),   "conf": 0.788},
    {"dog_idx": 12, "grado": 3, "punto": "PV",  "fecha": datetime.date(2026, 6, 4),   "conf": 0.819},
    # Semana 24 (2026-06-09)
    {"dog_idx": 0,  "grado": 1, "punto": "MV",  "fecha": datetime.date(2026, 6, 9),   "conf": 0.773},
    {"dog_idx": 7,  "grado": 2, "punto": "AV",  "fecha": datetime.date(2026, 6, 10),  "conf": 0.752},
    {"dog_idx": 14, "grado": 0, "punto": "TV",  "fecha": datetime.date(2026, 6, 11),  "conf": 0.938},
    # Semana 25 (2026-06-16)
    {"dog_idx": 2,  "grado": 3, "punto": "PV",  "fecha": datetime.date(2026, 6, 16),  "conf": 0.861},
    {"dog_idx": 5,  "grado": 2, "punto": "AV",  "fecha": datetime.date(2026, 6, 17),  "conf": 0.746},
    {"dog_idx": 11, "grado": 0, "punto": "MV",  "fecha": datetime.date(2026, 6, 17),  "conf": 0.971},
    {"dog_idx": 8,  "grado": 1, "punto": "TV",  "fecha": datetime.date(2026, 6, 18),  "conf": 0.783},
    {"dog_idx": 13, "grado": 3, "punto": "Phc", "fecha": datetime.date(2026, 6, 18),  "conf": 0.845},
    # Semana 26 (2026-06-23)
    {"dog_idx": 3,  "grado": 0, "punto": "PV",  "fecha": datetime.date(2026, 6, 24),  "conf": 0.922},
    {"dog_idx": 9,  "grado": 3, "punto": "MV",  "fecha": datetime.date(2026, 6, 24),  "conf": 0.878},
    {"dog_idx": 1,  "grado": 0, "punto": "AV",  "fecha": datetime.date(2026, 6, 25),  "conf": 0.936},
    {"dog_idx": 4,  "grado": 2, "punto": "TV",  "fecha": datetime.date(2026, 6, 26),  "conf": 0.761},
    # Semana 27 (2026-06-29)
    {"dog_idx": 0,  "grado": 0, "punto": "PV",  "fecha": datetime.date(2026, 6, 30),  "conf": 0.947},
    {"dog_idx": 6,  "grado": 1, "punto": "MV",  "fecha": datetime.date(2026, 7, 1),   "conf": 0.791},
    {"dog_idx": 10, "grado": 3, "punto": "AV",  "fecha": datetime.date(2026, 7, 1),   "conf": 0.853},
    {"dog_idx": 14, "grado": 2, "punto": "TV",  "fecha": datetime.date(2026, 7, 2),   "conf": 0.734},
    {"dog_idx": 12, "grado": 0, "punto": "Phc", "fecha": datetime.date(2026, 7, 2),   "conf": 0.958},
    {"dog_idx": 5,  "grado": 3, "punto": "PV",  "fecha": datetime.date(2026, 7, 3),   "conf": 0.867},
]

evals_data = evals_historicas + evals_recientes


def seed():
    with app.app_context():
        if db.session.execute(db.select(Owner)).scalars().first():
            print("Ya existen propietarios. Saltando seed.")
            sys.exit(0)

        print("Insertando propietarios...")
        owner_objects = []
        for od in owners_data:
            o = Owner(
                id=str(uuid.uuid4()),
                nombres=od["nombres"], apellidos=od["apellidos"],
                tipo_documento="DNI", dni=od["dni"],
                celular=od["celular"], correo=od["correo"],
                direccion=od["direccion"], sexo=od["sexo"],
                fechaNacimiento=od["fechaNacimiento"],
                departamento=od.get("departamento"),
                provincia=od.get("provincia"),
                distrito=od.get("distrito"),
            )
            db.session.add(o)
            owner_objects.append(o)
        db.session.flush()

        print("Insertando perros...")
        dog_objects = []
        for dd in dogs_data:
            d = Dog(
                id=str(uuid.uuid4()),
                especie="Canino",
                nombre=dd["nombre"], raza=dd["raza"],
                sexo=dd["sexo"], fechaNacimiento=dd["fechaNacimiento"],
                estado="Vivo", owner_id=owner_objects[dd["owner_idx"]].id,
            )
            db.session.add(d)
            dog_objects.append(d)
        db.session.flush()

        print("Insertando evaluaciones...")
        for ed in evals_data:
            grado, descripcion = GRADOS[ed["grado"]]
            dog = dog_objects[ed["dog_idx"]]
            e = Evaluation(
                id=str(uuid.uuid4()),
                fecha=ed["fecha"],
                resultado=grado,
                grado_levine=grado,
                descripcion_grado=descripcion,
                punto_auscultacion=ed["punto"],
                confianza_modelo=ed.get("conf"),
                dog_id=dog.id,
                comentarios=f"Evaluación de {dog.nombre}. Grado Levine: {grado}.",
            )
            db.session.add(e)

        db.session.commit()
        total_evals = len(evals_data)
        print(f"Seed completado: {len(owners_data)} propietarios, {len(dogs_data)} perros, {total_evals} evaluaciones.")
        print(f"  → {len(evals_historicas)} evaluaciones históricas")
        print(f"  → {len(evals_recientes)} evaluaciones en últimas 10 semanas")


if __name__ == "__main__":
    seed()
