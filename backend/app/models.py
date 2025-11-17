from app import db, bcrypt
from flask_jwt_extended import create_access_token
import datetime
import uuid # Necesario para los IDs de Owner y Dog

# --- Definiciones de Tipos de Roles ---
ROLES = ["asistente", "veterinario"]

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    role = db.Column(db.Enum(*ROLES, name='user_roles'), nullable=False, default='asistente')

    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)

    def get_jwt(self, expires_in=datetime.timedelta(hours=24)):
        # Genera el token JWT, convirtiendo el ID (int) a string
        return create_access_token(
            identity=str(self.id), 
            expires_delta=expires_in, 
            additional_claims={'role': self.role}
        )

class Owner(db.Model):
    __tablename__ = 'owners'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    nombres = db.Column(db.String(100), nullable=False)
    apellidos = db.Column(db.String(100), nullable=False)
    dni = db.Column(db.String(8), unique=True, nullable=False)
    celular = db.Column(db.String(9))
    correo = db.Column(db.String(120), unique=True, nullable=False)
    direccion = db.Column(db.String(255))
    sexo = db.Column(db.String(20))
    fechaNacimiento = db.Column(db.Date)
    
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
    
    # "Alto Riesgo", "Riesgo Moderado", "Normal"
    resultado = db.Column(db.String(100), nullable=False) 
    comentarios = db.Column(db.Text, nullable=True)
    
    # Foreign Key a la tabla Dog
    dog_id = db.Column(db.String(36), db.ForeignKey('dogs.id'), nullable=False)

    def serialize(self):
        """Devuelve una representación JSON del modelo Evaluation."""
        return {
            "id": self.id,
            "dogId": self.dog_id,
            "fecha": self.fecha.isoformat(),
            "resultado": self.resultado,
            "comentarios": self.comentarios
        }