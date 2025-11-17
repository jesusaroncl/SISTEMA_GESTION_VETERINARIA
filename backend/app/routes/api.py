import os
from flask import Blueprint, request, jsonify
from app import db
from app.config import Config
from werkzeug.utils import secure_filename
from app.models import Owner, Dog, User, Evaluation
from flask_jwt_extended import jwt_required, get_jwt
from sqlalchemy.exc import IntegrityError
import uuid
import datetime
from functools import wraps # Para el decorador role_required

api = Blueprint('api', __name__)

# --- Decorador de Roles ---
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

# --- Serializador de Propietario ---
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
        "fechaNacimiento": o.fechaNacimiento.isoformat() if o.fechaNacimiento else None,
    }

# ===================================================
# --- Rutas CRUD para Propietarios (Owner) ---
# ===================================================

@api.route('/owners', methods=['POST'])
@role_required('asistente') 
def create_owner():
    data = request.get_json()
    
    if not all(k in data for k in ["nombres", "apellidos", "dni", "correo"]):
        return jsonify({"msg": "Faltan campos requeridos"}), 400

    new_owner = Owner(
        # id se genera por default en el modelo
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

@api.route('/owners', methods=['GET'])
@jwt_required() 
def get_owners():
    owners = db.session.execute(db.select(Owner).order_by(Owner.apellidos)).scalars().all()
    owners_list = [serialize_owner(o) for o in owners]
    return jsonify(owners_list), 200

@api.route('/owners/<string:owner_id>', methods=['GET'])
@jwt_required()
def get_owner(owner_id):
    owner = db.session.get(Owner, owner_id)
    if not owner:
        return jsonify({"msg": "Propietario no encontrado"}), 404
    return jsonify(serialize_owner(owner)), 200

@api.route('/owners/<string:owner_id>', methods=['PUT'])
@role_required('asistente')
def update_owner(owner_id):
    owner = db.session.get(Owner, owner_id)
    if not owner:
        return jsonify({"msg": "Propietario no encontrado"}), 404
    
    data = request.get_json()
    owner.nombres = data.get('nombres', owner.nombres)
    owner.apellidos = data.get('apellidos', owner.apellidos)
    owner.dni = data.get('dni', owner.dni)
    owner.celular = data.get('celular', owner.celular)
    owner.correo = data.get('correo', owner.correo)
    owner.direccion = data.get('direccion', owner.direccion)
    owner.sexo = data.get('sexo', owner.sexo)
    
    fecha_str = data.get('fechaNacimiento')
    if fecha_str is not None:
        try:
            owner.fechaNacimiento = datetime.datetime.strptime(fecha_str, '%Y-%m-%d').date()
        except ValueError:
            owner.fechaNacimiento = None # O manejar error

    try:
        db.session.commit()
        return jsonify({"msg": "Propietario actualizado", "owner": serialize_owner(owner)}), 200
    except IntegrityError:
        db.session.rollback()
        return jsonify({"msg": "Error de integridad: DNI o correo ya existen"}), 409
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": "Error al actualizar propietario", "error": str(e)}), 500

@api.route('/owners/<string:owner_id>', methods=['DELETE'])
@role_required('asistente')
def delete_owner(owner_id):
    owner = db.session.get(Owner, owner_id)
    if not owner:
        return jsonify({"msg": "Propietario no encontrado"}), 404

    try:
        db.session.delete(owner)
        db.session.commit()
        return jsonify({"msg": "Propietario eliminado correctamente"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": "Error al eliminar propietario", "error": str(e)}), 500

# ===================================================
# --- Rutas CRUD para Perros (Dog) ---
# ===================================================

@api.route('/owners/<string:owner_id>/dogs', methods=['GET'])
@jwt_required()
def get_dogs_for_owner(owner_id):
    owner = db.session.get(Owner, owner_id)
    if not owner:
        return jsonify({"msg": "Propietario no encontrado"}), 404
    
    dogs_list = [dog.serialize() for dog in owner.dogs]
    return jsonify(dogs_list), 200

@api.route('/owners/<string:owner_id>/dogs', methods=['POST'])
@role_required('asistente')
def create_dog(owner_id):
    if not db.session.get(Owner, owner_id):
        return jsonify({"msg": "Propietario no encontrado"}), 404
        
    data = request.get_json()
    if not all(k in data for k in ["nombre", "raza", "fechaNacimiento", "sexo"]):
        return jsonify({"msg": "Faltan campos requeridos para el perro"}), 400

    new_dog = Dog(
        # id se genera por default
        especie=data.get('especie', 'Canino'),
        nombre=data['nombre'],
        raza=data['raza'],
        sexo=data['sexo'],
        estado=data.get('estado', 'Vivo'),
        fechaNacimiento=datetime.datetime.strptime(data['fechaNacimiento'], '%Y-%m-%d').date() if data.get('fechaNacimiento') else None,
        owner_id=owner_id
    )

    try:
        db.session.add(new_dog)
        db.session.commit()
        return jsonify({"msg": "Perro creado", "dog": new_dog.serialize()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": "Error al crear perro", "error": str(e)}), 500

@api.route('/dogs/<string:dog_id>', methods=['PUT'])
@role_required('asistente')
def update_dog(dog_id):
    dog = db.session.get(Dog, dog_id)
    if not dog:
        return jsonify({"msg": "Perro no encontrado"}), 404
    
    data = request.get_json()
    
    dog.especie = data.get('especie', dog.especie)
    dog.nombre = data.get('nombre', dog.nombre)
    dog.raza = data.get('raza', dog.raza)
    dog.sexo = data.get('sexo', dog.sexo)
    dog.estado = data.get('estado', dog.estado)
    fecha_str = data.get('fechaNacimiento')
    if fecha_str:
        dog.fechaNacimiento = datetime.datetime.strptime(fecha_str, '%Y-%m-%d').date()

    try:
        db.session.commit()
        return jsonify({"msg": "Perro actualizado", "dog": dog.serialize()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": "Error al actualizar perro", "error": str(e)}), 500

@api.route('/dogs/<string:dog_id>', methods=['DELETE'])
@role_required('asistente')
def delete_dog(dog_id):
    dog = db.session.get(Dog, dog_id)
    if not dog:
        return jsonify({"msg": "Perro no encontrado"}), 404

    try:
        db.session.delete(dog)
        db.session.commit()
        return jsonify({"msg": "Perro eliminado"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": "Error al eliminar perro", "error": str(e)}), 500



# ===================================================
# --- Ruta de Evaluación de Audio (ML) - CORREGIDA ---
# ===================================================

# (UPLOAD_FOLDER se mantiene)
UPLOAD_FOLDER = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'uploads'))
# Definir extensiones de AUDIO permitidas
ALLOWED_EXTENSIONS = {'wav', 'mp3'} 

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Función para calcular la edad (la necesitamos del frontend)
def calculate_age(birth_date_obj):
    if not birth_date_obj:
        return 0
    today = datetime.date.today()
    age = today.year - birth_date_obj.year - ((today.month, today.day) < (birth_date_obj.month, birth_date_obj.day))
    return age

@api.route('/dogs/<string:dog_id>/evaluate_audio', methods=['POST'])
@role_required('veterinario')
def evaluate_dog_audio(dog_id):
    
    dog = db.session.get(Dog, dog_id)
    if not dog:
        return jsonify({"msg": "Perro no encontrado"}), 404

    if 'soplo_cardiaco' not in request.files:
        return jsonify({"msg": "No se encontró el archivo de audio (soplo_cardiaco)"}), 400
    
    file = request.files['soplo_cardiaco']
    
    if file.filename == '':
        return jsonify({"msg": "No se seleccionó ningún archivo"}), 400

    if file and allowed_file(file.filename):
        # 1. Guardar el archivo de audio temporalmente
        filename = secure_filename(f"audio_{dog_id}_{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}.wav")
        audio_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(audio_path)

        try:
            # 2. Importación diferida (Lazy Import)
            # (Usamos el nombre de la función que creamos en predictor.py)
            from app.ml_model.predictor import predecir_soplo_cardiaco

            # 3. Llamar al modelo de ML (pasamos la RUTA del audio)
            prediccion = predecir_soplo_cardiaco(audio_path) 
            
            # 4. Determinar el riesgo
            es_riesgo = prediccion != "Normal"

            # 5. Calcular datos para el frontend
            edad = calculate_age(dog.fechaNacimiento)
            
            evaluation_data = {
                "raza": dog.raza,
                "edad": edad,
                "soploCardiaco": prediccion, # El resultado del modelo (ej: "Alto Riesgo")
                "esRiesgo": es_riesgo,
                "datosResultado": f"paciente con predicción de soplo (IA): {prediccion}"
            }
            
            # 6. Limpiar el archivo de audio temporal
            os.remove(audio_path) 
            
            return jsonify(evaluation_data), 200

        except Exception as e:
            # Limpiar si hay error
            if os.path.exists(audio_path):
                os.remove(audio_path)
            return jsonify({"msg": "Error al procesar el archivo de audio", "error": str(e)}), 500
    
    return jsonify({"msg": "Tipo de archivo no permitido (solo .wav o .mp3)"}), 400


# ===================================================
# --- Rutas CRUD para Evaluaciones (Evaluation) ---
# ===================================================

@api.route('/evaluations', methods=['POST'])
@role_required('veterinario')
def create_evaluation():
    """
    Crea un nuevo registro de evaluación.
    """
    data = request.get_json()
    dog_id = data.get('dogId')
    eval_data = data.get('evaluationData') 

    if not dog_id or not eval_data:
        return jsonify({"msg": "Faltan datos (dogId o evaluationData)"}), 400
    dog = db.session.get(Dog, dog_id)
    if not dog:
        return jsonify({"msg": "Perro no encontrado"}), 404

    # --- INICIO DE LA CORRECCIÓN ---
    # 1. Obtener la predicción real de la IA (ej: "Normal", "Riesgo Moderado")
    prediccion_ia = eval_data.get('soploCardiaco')
    
    # 2. El 'resultado' DEBE ser la predicción de la IA.
    resultado_str = prediccion_ia
    
    # 3. El booleano 'esRiesgo' debe basarse en la predicción
    es_riesgo_bool = prediccion_ia != "Normal"

    # 4. Construir el comentario
    comentarios_str = (
        f"Paciente de {eval_data.get('edad')} años, raza {eval_data.get('raza')}. "
        f"Predicción IA: {prediccion_ia}. {eval_data.get('datosResultado')}. "
        # Usar el booleano 'es_riesgo_bool' para el comentario final
        f"{'Se recomienda seguimiento inmediato.' if es_riesgo_bool else 'Continuar con monitoreo regular.'}"
    )
    # --- FIN DE LA CORRECCIÓN ---

    new_evaluation = Evaluation(
        resultado=resultado_str,
        comentarios=comentarios_str,
        dog_id=dog_id
    )
    
    try:
        db.session.add(new_evaluation)
        db.session.commit()
        return jsonify(new_evaluation.serialize()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": "Error al guardar la evaluación", "error": str(e)}), 500

@api.route('/dogs/<string:dog_id>/evaluations', methods=['GET'])
@jwt_required() # Permitir que ambos roles vean el historial
def get_evaluations_for_dog(dog_id):
    """Obtiene todas las evaluaciones de un perro específico."""
    dog = db.session.get(Dog, dog_id)
    if not dog:
        return jsonify({"msg": "Perro no encontrado"}), 404
    
    # Buscar evaluaciones ordenadas por fecha descendente
    evals = db.session.execute(
        db.select(Evaluation).filter_by(dog_id=dog_id).order_by(Evaluation.fecha.desc())
    ).scalars().all()
    
    return jsonify([e.serialize() for e in evals]), 200