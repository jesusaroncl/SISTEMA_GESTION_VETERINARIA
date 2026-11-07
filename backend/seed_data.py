"""
Datos de prueba — Sistema de Gestión Veterinaria
Uso (ejecutar DESPUÉS de seed_users.py, que crea las clínicas):
  docker exec veterinaria_backend python3 seed_data.py        # local
  docker exec veterinaria_prod_backend python3 seed_data.py   # producción

Carga propietarios, perros y evaluaciones en las dos clínicas de prueba:
  - Clínica Demo  (RUC 20123456789): Lima, 30 propietarios
  - Clínica Norte (RUC 20987654321): Trujillo, 15 propietarios

Las fechas de las evaluaciones son relativas al día en que se ejecuta (último año,
con más actividad en las últimas 10 semanas), así el dashboard siempre tiene datos.
Los datos salen de una semilla fija: siempre los mismos registros (solo cambian las fechas).
Una clínica que ya tiene propietarios se salta (no duplica nada).
"""
import datetime
import random
import uuid

from app import create_app, db
from app.models import Breed, Clinic, Dog, Evaluation, Owner, Ubigeo

HOY = datetime.date.today()

GRADOS = {
    "AUSENTE": "Ausencia del soplo cardíaco",
    "I /VI": "Soplo muy suave, solo audible en condiciones ideales",
    "II /VI": "Soplo suave pero fácilmente audible",
    "III /VI": "Si es moderadamente intenso o intenso.",
}
ORDEN_GRADOS = list(GRADOS)
PUNTOS = ["MV", "MV", "MV", "TV", "AV", "PV", "Phc"]  # el foco mitral es el más auscultado

CLINICAS = [
    {
        "ruc": "20123456789", "nombre": "Clínica Demo", "propietarios": 30, "prefijo_correo": "demo",
        # ubigeos de Lima Metropolitana
        "ubigeos": ["150122", "150131", "150140", "150114", "150130", "150113", "150116", "150121",
                    "150120", "150136", "150104", "150108", "150117", "150135", "150141", "150101"],
        "calles": ["Av. Arequipa", "Av. Brasil", "Av. Javier Prado", "Jr. Huancavelica", "Av. La Marina",
                   "Calle Los Pinos", "Av. Benavides", "Av. Primavera", "Jr. Ucayali", "Av. Angamos"],
    },
    {
        "ruc": "20987654321", "nombre": "Clínica Norte", "propietarios": 15, "prefijo_correo": "norte",
        # ubigeos de Trujillo
        "ubigeos": ["130101", "130111", "130104", "130105", "130102", "130107"],
        "calles": ["Av. España", "Av. Larco", "Jr. Pizarro", "Av. América Sur", "Calle Bolívar", "Av. Húsares de Junín"],
    },
]

NOMBRES_M = ["Carlos", "Juan", "Luis", "Jorge", "José", "Miguel", "Pedro", "Diego", "Renzo", "Andrés",
             "Sebastián", "Kevin", "Bryan", "Fernando", "Ricardo", "Álvaro", "Gonzalo", "Marco"]
NOMBRES_F = ["María", "Lucía", "Ana", "Rosa", "Carmen", "Valeria", "Camila", "Fiorella", "Andrea",
             "Daniela", "Milagros", "Gabriela", "Claudia", "Jimena", "Sofía", "Patricia", "Diana"]
APELLIDOS = ["Quispe", "Flores", "Rodríguez", "Sánchez", "García", "Torres", "Ramos", "Mendoza", "Vargas",
             "Chávez", "Castillo", "Rojas", "Huamán", "Mamani", "Paredes", "Gutiérrez", "Vega", "Ríos",
             "Díaz", "Salazar", "Cruz", "Espinoza", "Romero", "Herrera", "Medina", "Aguilar"]

NOMBRES_PERRO_M = ["Rocky", "Max", "Toby", "Simba", "Thor", "Bruno", "Duke", "Coco", "Zeus", "Firulais",
                   "Oso", "Chester", "Jack", "Milo", "Rambo", "Tyson", "Lucas", "Bobby", "Scooby", "Pancho"]
NOMBRES_PERRO_H = ["Luna", "Bella", "Nala", "Mia", "Kira", "Lola", "Canela", "Princesa", "Maya", "Chispa",
                   "Lucy", "Daisy", "Molly", "Frida", "Nina", "Kiara", "Sasha", "Perla", "Muñeca", "Linda"]

# Razas pequeñas: la enfermedad valvular mitral (causa principal de soplo) es mucho más frecuente
RAZAS_PEQUENAS = ["Chihuahua", "Poodle", "Yorkshire Terrier", "Shih Tzu", "Maltese", "Pomeranian",
                  "Cavalier King Charles Spaniel", "Miniature Schnauzer", "Dachshund", "Pekingese"]
RAZAS_GRANDES = ["Labrador Retriever", "Golden Retriever", "German Shepherd", "Rottweiler", "Boxer",
                 "Siberian Husky", "Beagle", "Cocker Spaniel", "French Bulldog", "Doberman Pinscher"]

COMENTARIOS = {
    "AUSENTE": ["Auscultación normal, ritmo regular.", "Control de rutina sin hallazgos.",
                "Sin soplo audible. Próximo control en 6 meses."],
    "I /VI": ["Soplo leve, se recomienda control en 3 meses.", "Hallazgo leve, sin signos clínicos.",
              "Soplo suave en reposo. Vigilar tos o cansancio."],
    "II /VI": ["Soplo audible, se sugiere ecocardiograma.", "Soplo sistólico leve, control en 2 meses.",
               "Se indica radiografía de tórax de control."],
    "III /VI": ["Soplo moderado, derivar a cardiología.", "Se recomienda ecocardiograma y tratamiento.",
                "Soplo intenso; evaluar inicio de medicación cardíaca."],
}


def fecha_aleatoria(rng, desde, hasta):
    return desde + datetime.timedelta(days=rng.randint(0, max((hasta - desde).days, 0)))


def edad(nacimiento, fecha):
    return (fecha - nacimiento).days / 365.25


def grado_inicial(rng, raza_pequena, edad_anios):
    """Probabilidad de soplo según tamaño de la raza y edad (más soplos en perros pequeños y mayores)."""
    riesgo = (0.25 if raza_pequena else 0.08) + max(edad_anios - 5, 0) * (0.07 if raza_pequena else 0.03)
    if rng.random() > min(riesgo, 0.85):
        return "AUSENTE"
    severidad = rng.random() + (0.25 if edad_anios > 10 else 0)
    if severidad < 0.5:
        return "I /VI"
    if severidad < 0.85:
        return "II /VI"
    return "III /VI"


def confianza(rng, grado):
    base = {"AUSENTE": 0.93, "I /VI": 0.78, "II /VI": 0.80, "III /VI": 0.86}[grado]
    return round(min(max(rng.gauss(base, 0.04), 0.62), 0.99), 3)


def fechas_evaluacion(rng, nacimiento):
    """Entre 1 y 5 evaluaciones en el último año; ~40% caen en las últimas 10 semanas."""
    inicio = max(HOY - datetime.timedelta(days=365), nacimiento + datetime.timedelta(days=60))
    recientes = HOY - datetime.timedelta(weeks=10)
    fechas = set()
    for _ in range(rng.choice([1, 2, 2, 3, 3, 4, 5])):
        if rng.random() < 0.4 and recientes > inicio:
            fechas.add(fecha_aleatoria(rng, recientes, HOY))
        else:
            fechas.add(fecha_aleatoria(rng, inicio, HOY))
    return sorted(fechas)


def ubigeos(codigos):
    """Datos de ubigeo desde el catálogo de la BD (si el catálogo está vacío, se dejan en blanco)."""
    filas = db.session.execute(db.select(Ubigeo).where(Ubigeo.codigo.in_(codigos))).scalars().all()
    encontrados = [(u.codigo, u.departamento, u.provincia, u.distrito) for u in filas]
    return encontrados or [(None, None, None, None)]


def razas_disponibles(nombres):
    catalogo = set(db.session.execute(db.select(Breed.nombre)).scalars().all())
    validas = [r for r in nombres if r in catalogo]
    return validas or nombres


def sembrar_clinica(cfg, rng, dni_usados):
    clinic = db.session.execute(db.select(Clinic).filter_by(ruc=cfg["ruc"])).scalar_one_or_none()
    if not clinic:
        clinic = Clinic(nombre=cfg["nombre"], ruc=cfg["ruc"])
        db.session.add(clinic)
        db.session.flush()
        print(f"  + {cfg['nombre']} creada (ejecuta seed_users.py para tener usuarios)")
    if db.session.execute(db.select(Owner.id).filter_by(clinic_id=clinic.id)).first():
        print(f"  = {clinic.nombre}: ya tiene propietarios, se salta")
        return

    lugares = ubigeos(cfg["ubigeos"])
    pequenas = razas_disponibles(RAZAS_PEQUENAS)
    grandes = razas_disponibles(RAZAS_GRANDES)
    totales = {"propietarios": 0, "perros": 0, "evaluaciones": 0}

    for i in range(cfg["propietarios"]):
        sexo = rng.choice(["Masculino", "Femenino"])
        nombres = " ".join(rng.sample(NOMBRES_M if sexo == "Masculino" else NOMBRES_F, 2))
        apellidos = " ".join(rng.sample(APELLIDOS, 2))

        # 1 de cada 10 con carnet de extranjería; el resto con DNI
        tipo = "Carnet de extranjería" if i % 10 == 9 else "DNI"
        while True:
            dni = str(rng.randint(10**8, 10**9 - 1)) if tipo != "DNI" else str(rng.randint(10**7, 10**8 - 1))
            if dni not in dni_usados:
                dni_usados.add(dni)
                break

        codigo, departamento, provincia, distrito = rng.choice(lugares)
        primer_nombre = nombres.split()[0].lower()
        primer_apellido = apellidos.split()[0].lower()
        owner = Owner(
            id=str(uuid.uuid4()),
            clinic_id=clinic.id,
            nombres=nombres,
            apellidos=apellidos,
            tipo_documento=tipo,
            dni=dni,
            celular="9" + str(rng.randint(10**7, 10**8 - 1)),
            correo=f"{primer_nombre}.{primer_apellido}{i + 1}@{cfg['prefijo_correo']}.local"
            .translate(str.maketrans("áéíóúñ", "aeioun")),
            direccion=f"{rng.choice(cfg['calles'])} {rng.randint(100, 2999)}",
            sexo=sexo,
            # Propietarios adultos nacidos desde el 2000 (regla de QA: fechas desde el año 2000)
            fechaNacimiento=fecha_aleatoria(rng, datetime.date(2000, 1, 1), datetime.date(2007, 12, 31)),
            ubigeo=codigo,
            departamento=departamento,
            provincia=provincia,
            distrito=distrito,
        )
        db.session.add(owner)
        totales["propietarios"] += 1

        nombres_usados = set()
        for _ in range(rng.choice([1, 1, 2, 2, 2, 3])):
            sexo_perro = rng.choice(["Macho", "Hembra"])
            opciones = [n for n in (NOMBRES_PERRO_M if sexo_perro == "Macho" else NOMBRES_PERRO_H) if n not in nombres_usados]
            nombre = rng.choice(opciones)
            nombres_usados.add(nombre)  # un propietario no puede tener dos perros con el mismo nombre

            pequena = rng.random() < 0.55
            nacimiento = fecha_aleatoria(rng, HOY - datetime.timedelta(days=int(15 * 365.25)), HOY - datetime.timedelta(days=200))
            fechas = fechas_evaluacion(rng, nacimiento)
            # Algunos perros mayores ya fallecieron (sin evaluaciones en los últimos 2 meses)
            sin_control_reciente = (HOY - fechas[-1]).days > 60
            estado = "Muerto" if edad(nacimiento, HOY) > 12 and sin_control_reciente and rng.random() < 0.4 else "Vivo"

            dog = Dog(
                id=str(uuid.uuid4()),
                especie="Canino",
                nombre=nombre,
                raza=rng.choice(pequenas if pequena else grandes),
                sexo=sexo_perro,
                fechaNacimiento=nacimiento,
                estado=estado,
                owner_id=owner.id,
            )
            db.session.add(dog)
            totales["perros"] += 1

            # El grado de un mismo perro no retrocede: la enfermedad valvular avanza con el tiempo
            nivel = ORDEN_GRADOS.index(grado_inicial(rng, pequena, edad(nacimiento, fechas[0])))
            for n, fecha in enumerate(fechas):
                if n and nivel < 3 and rng.random() < (0.3 if nivel else 0.12):
                    nivel += 1
                grado = ORDEN_GRADOS[nivel]
                db.session.add(Evaluation(
                    id=str(uuid.uuid4()),
                    fecha=fecha,
                    resultado=grado,
                    grado_levine=grado,
                    descripcion_grado=GRADOS[grado],
                    punto_auscultacion=rng.choice(PUNTOS),
                    confianza_modelo=confianza(rng, grado),
                    dog_id=dog.id,
                    comentarios=rng.choice(COMENTARIOS[grado]),
                ))
                totales["evaluaciones"] += 1

    db.session.flush()
    print(f"  + {clinic.nombre}: {totales['propietarios']} propietarios, "
          f"{totales['perros']} perros, {totales['evaluaciones']} evaluaciones")


def seed():
    app = create_app()
    with app.app_context():
        rng = random.Random(2026)
        dni_usados = set()
        for cfg in CLINICAS:
            sembrar_clinica(cfg, rng, dni_usados)
        db.session.commit()
        print("\nDatos de prueba listos.")


if __name__ == "__main__":
    seed()
