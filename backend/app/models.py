from app import db, bcrypt
from flask_jwt_extended import create_access_token
import datetime
import uuid # Necesario para los IDs de Owner y Dog

# --- Definiciones de Tipos de Roles ---
ROLES = ["administrador", "asistente", "veterinario"]

class Ubigeo(db.Model):
    __tablename__ = 'ubigeo'
    codigo = db.Column(db.String(6), primary_key=True)
    departamento = db.Column(db.String(100), nullable=False)
    provincia = db.Column(db.String(100), nullable=False)
    distrito = db.Column(db.String(100), nullable=False)

class Breed(db.Model):
    __tablename__ = 'breeds'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False, unique=True)

class Clinic(db.Model):
    """Tenant: cada clínica tiene sus propios usuarios, propietarios, perros y evaluaciones."""
    __tablename__ = 'clinics'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(150), nullable=False)
    ruc = db.Column(db.String(11), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.datetime.utcnow)

    memberships = db.relationship('ClinicMembership', backref='clinic', lazy=True, cascade="all, delete-orphan")
    owners = db.relationship('Owner', backref='clinic', lazy=True)

class ClinicMembership(db.Model):
    """Una persona (User) puede trabajar en varias clínicas, con un rol en cada una."""
    __tablename__ = 'clinic_memberships'
    __table_args__ = (db.UniqueConstraint('user_id', 'clinic_id', name='uq_membership_user_clinic'),)
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    clinic_id = db.Column(db.Integer, db.ForeignKey('clinics.id', ondelete='CASCADE'), nullable=False)
    role = db.Column(db.Enum(*ROLES, name='user_roles', create_type=False), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.datetime.utcnow)

class ClinicInvitation(db.Model):
    """Invitación por correo a unirse a una clínica. Solo se guarda el hash del token."""
    __tablename__ = 'clinic_invitations'
    id = db.Column(db.Integer, primary_key=True)
    clinic_id = db.Column(db.Integer, db.ForeignKey('clinics.id', ondelete='CASCADE'), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    role = db.Column(db.Enum(*ROLES, name='user_roles', create_type=False), nullable=False)
    token_hash = db.Column(db.String(64), unique=True, nullable=False)
    invited_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=False)
    accepted_at = db.Column(db.DateTime, nullable=True)

    clinic = db.relationship('Clinic')

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=True)
    reset_code_hash = db.Column(db.String(64), nullable=True)
    reset_code_expires = db.Column(db.DateTime, nullable=True)
    reset_code_attempts = db.Column(db.Integer, nullable=False, default=0, server_default='0')
    password_hash = db.Column(db.String(128), nullable=False)

    memberships = db.relationship('ClinicMembership', backref='user', lazy=True, cascade="all, delete-orphan")

    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)

    def get_jwt(self, membership, expires_in=datetime.timedelta(hours=24)):
        # El token queda ligado a UNA clínica activa y al rol que tiene en ella
        return create_access_token(
            identity=str(self.id),
            expires_delta=expires_in,
            additional_claims={'role': membership.role, 'clinic_id': membership.clinic_id}
        )

class Owner(db.Model):
    __tablename__ = 'owners'
    __table_args__ = (
        db.UniqueConstraint('clinic_id', 'dni', name='uq_owners_clinic_dni'),
        db.UniqueConstraint('clinic_id', 'correo', name='uq_owners_clinic_correo'),
    )
    clinic_id = db.Column(db.Integer, db.ForeignKey('clinics.id'), nullable=False)
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    nombres = db.Column(db.String(100), nullable=False)
    apellidos = db.Column(db.String(100), nullable=False)
    tipo_documento = db.Column(db.String(50), nullable=False, default='DNI')
    dni = db.Column(db.String(20), nullable=False)
    celular = db.Column(db.String(9))
    correo = db.Column(db.String(120), nullable=False)
    direccion = db.Column(db.String(255))
    sexo = db.Column(db.String(20))
    fechaNacimiento = db.Column(db.Date)
    ubigeo = db.Column(db.String(6), nullable=True)
    departamento = db.Column(db.String(100), nullable=True)
    provincia = db.Column(db.String(100), nullable=True)
    distrito = db.Column(db.String(100), nullable=True)

    # Relación: Un propietario puede tener muchos perros.
    # cascade="all, delete-orphan": Si se borra un Owner, se borran sus Dogs.
    dogs = db.relationship('Dog', backref='owner', lazy=True, cascade="all, delete-orphan")

class Dog(db.Model):
    __tablename__ = 'dogs'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    especie = db.Column(db.String(50), nullable=False, default='Canino')
    nombre = db.Column(db.String(100), nullable=False)
    raza = db.Column(db.String(100), nullable=False)
    fechaNacimiento = db.Column(db.Date)
    sexo = db.Column(db.String(20))
    estado = db.Column(db.String(20), default='Vivo')
    
    # Relación: Un perro pertenece a un propietario (Foreign Key)
    owner_id = db.Column(db.String(36), db.ForeignKey('owners.id'), nullable=False)
    evaluations = db.relationship('Evaluation', backref='dog', lazy=True, cascade="all, delete-orphan")
    
    def serialize(self):
        """Devuelve una representación JSON del modelo Dog."""
        return {
            "id": self.id,
            "ownerId": self.owner_id,
            "especie": self.especie,
            "nombre": self.nombre,
            "raza": self.raza,
            "fechaNacimiento": self.fechaNacimiento.isoformat() if self.fechaNacimiento else None,
            "sexo": self.sexo,
            "estado": self.estado
        }

class Evaluation(db.Model):
    __tablename__ = 'evaluations'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    fecha = db.Column(db.Date, nullable=False, default=datetime.date.today)

    # Grado Levine (AUSENTE | I /VI | II /VI | III /VI)
    resultado = db.Column(db.String(100), nullable=False)
    comentarios = db.Column(db.Text, nullable=True)

    # Clasificación del soplo cardíaco — Grado Levine + descripción
    categoria = db.Column(db.String(50), nullable=True)       # obsoleto, no se usa
    grado_levine = db.Column(db.String(20), nullable=True)    # "AUSENTE" | "I /VI" | "II /VI" | "III /VI"
    descripcion_grado = db.Column(db.Text, nullable=True)

    # Punto de auscultación detectado desde el nombre del archivo
    punto_auscultacion = db.Column(db.String(100), nullable=True)

    # Confianza del modelo CNN (0.0 - 1.0)
    confianza_modelo = db.Column(db.Float, nullable=True)

    # Foreign Key a la tabla Dog
    dog_id = db.Column(db.String(36), db.ForeignKey('dogs.id'), nullable=False)

    def serialize(self):
        """Devuelve una representación JSON del modelo Evaluation."""
        return {
            "id": self.id,
            "dogId": self.dog_id,
            "fecha": self.fecha.isoformat(),
            "resultado": self.resultado,
            "comentarios": self.comentarios,
            "categoria": self.categoria,
            "gradoLevine": self.grado_levine,
            "descripcionGrado": self.descripcion_grado,
            "puntoAuscultacion": self.punto_auscultacion,
            "confianzaModelo": self.confianza_modelo,
        }