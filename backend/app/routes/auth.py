from flask import Blueprint, request, jsonify
from app import db
from app.models import User
from sqlalchemy.exc import IntegrityError

auth = Blueprint('auth', __name__)

@auth.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    role = data.get('role', 'asistente') # Rol por defecto

    if not username or not password:
        return jsonify({"msg": "Faltan usuario o contraseña"}), 400

    if role not in ["asistente", "veterinario"]:
        return jsonify({"msg": "Rol inválido"}), 400

    new_user = User(username=username, role=role)
    new_user.set_password(password)

    try:
        db.session.add(new_user)
        db.session.commit()
        return jsonify({"msg": f"Usuario {username} registrado como {role}"}), 201
    except IntegrityError:
        db.session.rollback()
        return jsonify({"msg": "El usuario ya existe"}), 409
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": "Error interno del servidor", "error": str(e)}), 500


@auth.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    user = db.session.execute(db.select(User).filter_by(username=username)).scalar_one_or_none()

    if user and user.check_password(password):
        # Generar JWT que incluye el rol
        access_token = user.get_jwt()
        
        # Devolvemos los datos que el frontend necesita
        return jsonify({
            "access_token": access_token,
            "userRole": user.role,
            "username": user.username
        }), 200
    
    return jsonify({"msg": "Credenciales inválidas"}), 401