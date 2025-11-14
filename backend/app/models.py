from app import db, bcrypt
from flask_jwt_extended import create_access_token
import datetime

# --- Definiciones de Tipos de Roles ---
# De tu frontend: "asistente" o "veterinario"
ROLES = ["asistente", "veterinario"]

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True) # <-- El ID es un entero
    username = db.Column(db.String(64), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    role = db.Column(db.Enum(*ROLES, name='user_roles'), nullable=False, default='asistente')

    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)


    def get_jwt(self, expires_in=datetime.timedelta(hours=24)):
        return create_access_token(
            identity=str(self.id), 
            expires_delta=expires_in, 
            additional_claims={'role': self.role}
        )

class Owner(db.Model):
    # Modelo para el CRUD, alineado con tu frontend (Owner)
    __tablename__ = 'owners'
    id = db.Column(db.String(36), primary_key=True) # Usar un UUID o String para 'id'
    nombres = db.Column(db.String(100), nullable=False)
    apellidos = db.Column(db.String(100), nullable=False)
    dni = db.Column(db.String(8), unique=True, nullable=False)
    celular = db.Column(db.String(9))
    correo = db.Column(db.String(120), unique=True, nullable=False)
    direccion = db.Column(db.String(255))
    sexo = db.Column(db.String(20)) # "Masculino" | "Femenino"
    fechaNacimiento = db.Column(db.Date)
    
    # ... otros campos (como perros asociados, si implementas la relación)