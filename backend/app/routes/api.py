from flask import Blueprint, request, jsonify
from app import db
from app.models import Owner
from flask_jwt_extended import jwt_required, get_jwt
from sqlalchemy.exc import IntegrityError
import uuid
import datetime
from functools import wraps

api = Blueprint('api', __name__)

# Función de ayuda para verificar roles
def role_required(role):
    def wrapper(fn):
        @wraps(fn) 
        @jwt_required()
        def decorator(*args, **kwargs):
            current_user_role = get_jwt().get('role')
            if current_user_role != role:
                return jsonify({"msg": "Permiso denegado: rol insuficiente"}), 403
            return fn(*args, **kwargs)
        return decorator
    return wrapper

# Función de ayuda para serializar un objeto Owner
def serialize_owner(o: Owner):
    return {
        "id": o.id,
        "nombres": o.nombres,
        "apellidos": o.apellidos,
        "dni": o.dni,
        "celular": o.celular,
        "correo": o.correo,
        "direccion": o.direccion,
        "sexo": o.sexo,
        # Convierte la fecha a string ISO 8601 (YYYY-MM-DD)
        "fechaNacimiento": o.fechaNacimiento.isoformat() if o.fechaNacimiento else None,
    }

# --- 1. POST: Crear Propietario (CRUD: Create) ---
@api.route('/owners', methods=['POST'])
@role_required('asistente') 
def create_owner():
    data = request.get_json()
    
    if not all(k in data for k in ["nombres", "apellidos", "dni", "correo"]):
        return jsonify({"msg": "Faltan campos requeridos"}), 400

    new_owner = Owner(
        id=str(uuid.uuid4()), 
        nombres=data['nombres'],
        apellidos=data['apellidos'],
        dni=data['dni'],
        celular=data.get('celular'),
        correo=data['correo'],
        direccion=data.get('direccion'),
        sexo=data.get('sexo'),
        fechaNacimiento=datetime.datetime.strptime(data['fechaNacimiento'], '%Y-%m-%d').date() if data.get('fechaNacimiento') else None
    )

    try:
        db.session.add(new_owner)
        db.session.commit()
        return jsonify({"msg": "Propietario creado", "owner": serialize_owner(new_owner)}), 201
    except IntegrityError:
        db.session.rollback()
        return jsonify({"msg": "Error de integridad: DNI o correo ya existen"}), 409
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": "Error al crear propietario", "error": str(e)}), 500

# --- 2. GET: Listar todos los Propietarios (CRUD: Read All) ---
@api.route('/owners', methods=['GET'])
@jwt_required() 
def get_owners():
    owners = db.session.execute(db.select(Owner).order_by(Owner.apellidos)).scalars().all()
    
    owners_list = [serialize_owner(o) for o in owners]
    
    return jsonify(owners_list), 200

# --- 3. GET: Obtener un Propietario por ID (CRUD: Read Single) ---
@api.route('/owners/<string:owner_id>', methods=['GET'])
@jwt_required()
def get_owner(owner_id):
    owner = db.session.execute(db.select(Owner).filter_by(id=owner_id)).scalar_one_or_none()

    if not owner:
        return jsonify({"msg": "Propietario no encontrado"}), 404

    return jsonify(serialize_owner(owner)), 200

# --- 4. PUT: Actualizar un Propietario (CRUD: Update) ---
@api.route('/owners/<string:owner_id>', methods=['PUT'])
@role_required('asistente') # Solo el asistente puede editar
def update_owner(owner_id):
    owner = db.session.execute(db.select(Owner).filter_by(id=owner_id)).scalar_one_or_none()
    
    if not owner:
        return jsonify({"msg": "Propietario no encontrado"}), 404
    
    data = request.get_json()

    # Actualizar campos
    owner.nombres = data.get('nombres', owner.nombres)
    owner.apellidos = data.get('apellidos', owner.apellidos)
    owner.dni = data.get('dni', owner.dni)
    owner.celular = data.get('celular', owner.celular)
    owner.correo = data.get('correo', owner.correo)
    owner.direccion = data.get('direccion', owner.direccion)
    owner.sexo = data.get('sexo', owner.sexo)
    
    # Manejar la fecha de nacimiento (debe ser convertida si viene en el JSON)
    fecha_str = data.get('fechaNacimiento')
    if fecha_str is not None:
        try:
            owner.fechaNacimiento = datetime.datetime.strptime(fecha_str, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({"msg": "Formato de fecha de nacimiento inválido (debe ser YYYY-MM-DD)"}), 400

    try:
        db.session.commit()
        return jsonify({"msg": "Propietario actualizado", "owner": serialize_owner(owner)}), 200
    except IntegrityError:
        db.session.rollback()
        return jsonify({"msg": "Error de integridad: DNI o correo ya existen"}), 409
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": "Error al actualizar propietario", "error": str(e)}), 500

# --- 5. DELETE: Eliminar un Propietario (CRUD: Delete) ---
@api.route('/owners/<string:owner_id>', methods=['DELETE'])
@role_required('asistente') # Solo el asistente puede eliminar
def delete_owner(owner_id):
    owner = db.session.execute(db.select(Owner).filter_by(id=owner_id)).scalar_one_or_none()
    
    if not owner:
        return jsonify({"msg": "Propietario no encontrado"}), 404

    try:
        # En una aplicación real, se debería verificar si el propietario tiene perros.
        # Por ahora, solo lo eliminamos.
        db.session.delete(owner)
        db.session.commit()
        return jsonify({"msg": "Propietario eliminado correctamente"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": "Error al eliminar propietario", "error": str(e)}), 500