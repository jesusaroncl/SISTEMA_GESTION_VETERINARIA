import hashlib
import hmac
import secrets
import smtplib
import datetime
from email.message import EmailMessage
from flask import Blueprint, request, jsonify, current_app
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from app import db
from app.models import User, Clinic
from sqlalchemy.exc import IntegrityError

auth = Blueprint('auth', __name__)

@auth.route('/register-clinic', methods=['POST'])
def register_clinic():
    """Registra una clínica (tenant) junto con su usuario administrador."""
    data = request.get_json(silent=True) or {}
    nombre = (data.get('clinicName') or '').strip()
    ruc = (data.get('ruc') or '').strip()
    username = (data.get('username') or '').strip()
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''

    if not all([nombre, ruc, username, email, password]):
        return jsonify({"msg": "Completa todos los campos"}), 400
    if not (ruc.isdigit() and len(ruc) == 11):
        return jsonify({"msg": "El RUC debe tener 11 dígitos"}), 400
    if len(password) < 6:
        return jsonify({"msg": "La contraseña debe tener al menos 6 caracteres"}), 400

    if db.session.execute(db.select(Clinic).filter_by(ruc=ruc)).scalar_one_or_none():
        return jsonify({"msg": "Ya existe una clínica registrada con ese RUC"}), 409
    if db.session.execute(
        db.select(User).where((User.username == username) | (User.email == email))
    ).scalars().first():
        return jsonify({"msg": "El usuario o el correo ya están en uso"}), 409

    try:
        clinic = Clinic(nombre=nombre, ruc=ruc)
        admin = User(username=username, email=email, role='administrador', clinic=clinic)
        admin.set_password(password)
        db.session.add_all([clinic, admin])
        db.session.commit()
        return jsonify({"msg": f"Clínica {nombre} registrada. Ya puedes iniciar sesión."}), 201
    except IntegrityError:
        db.session.rollback()
        return jsonify({"msg": "El RUC, usuario o correo ya están en uso"}), 409
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
            "username": user.username,
            "clinicName": user.clinic.nombre,
        }), 200
    
    return jsonify({"msg": "Credenciales inválidas"}), 401


CODE_TTL = datetime.timedelta(minutes=10)
MAX_CODE_ATTEMPTS = 5


def _serializer():
    return URLSafeTimedSerializer(current_app.config['SECRET_KEY'], salt='password-reset')


def _hash_code(code):
    return hashlib.sha256(f"{current_app.config['SECRET_KEY']}:{code}".encode()).hexdigest()


def _find_user(identifier):
    identifier = (identifier or '').strip()
    if not identifier:
        return None
    return db.session.execute(
        db.select(User).where((User.username == identifier) | (User.email == identifier.lower()))
    ).scalars().first()


def _send_code_email(user, code):
    cfg = current_app.config
    if not cfg.get('SMTP_HOST'):
        # Sin SMTP configurado (dev): el código queda en los logs del backend
        current_app.logger.warning("SMTP no configurado. Código de recuperación para %s: %s", user.username, code)
        return
    msg = EmailMessage()
    msg['Subject'] = 'Código de recuperación - Sistema de Gestión Veterinaria'
    msg['From'] = cfg['SMTP_FROM']
    msg['To'] = user.email
    msg.set_content(
        f"Hola {user.username},\n\nTu código de recuperación es: {code}\n\n"
        "Es válido por 10 minutos. Si no lo solicitaste, ignora este mensaje."
    )
    with smtplib.SMTP(cfg['SMTP_HOST'], cfg['SMTP_PORT'], timeout=10) as smtp:
        smtp.starttls()
        if cfg.get('SMTP_USER'):
            smtp.login(cfg['SMTP_USER'], cfg['SMTP_PASSWORD'])
        smtp.send_message(msg)


@auth.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json(silent=True) or {}
    identifier = (data.get('identifier') or '').strip()
    if not identifier:
        return jsonify({"msg": "Ingrese su usuario o correo"}), 400

    user = _find_user(identifier)
    if user and user.email:
        code = f"{secrets.randbelow(1000000):06d}"
        user.reset_code_hash = _hash_code(code)
        user.reset_code_expires = datetime.datetime.utcnow() + CODE_TTL
        user.reset_code_attempts = 0
        db.session.commit()
        try:
            _send_code_email(user, code)
        except Exception:
            current_app.logger.exception("Error enviando código de recuperación")

    # Respuesta genérica: no revela si la cuenta existe
    return jsonify({"msg": "Si la cuenta existe y tiene un correo registrado, enviamos un código de 6 dígitos."}), 200


@auth.route('/verify-reset-code', methods=['POST'])
def verify_reset_code():
    data = request.get_json(silent=True) or {}
    code = (data.get('code') or '').strip()
    invalid = jsonify({"msg": "Código inválido o expirado"}), 400

    user = _find_user(data.get('identifier'))
    if not user or not user.reset_code_hash or not user.reset_code_expires:
        return invalid

    if datetime.datetime.utcnow() > user.reset_code_expires or user.reset_code_attempts >= MAX_CODE_ATTEMPTS:
        user.reset_code_hash = None
        user.reset_code_expires = None
        db.session.commit()
        return invalid

    if not hmac.compare_digest(user.reset_code_hash, _hash_code(code)):
        user.reset_code_attempts += 1
        db.session.commit()
        return invalid

    # Código correcto: se consume y se entrega un token corto para fijar la nueva contraseña
    user.reset_code_hash = None
    user.reset_code_expires = None
    user.reset_code_attempts = 0
    db.session.commit()
    token = _serializer().dumps({"uid": user.id, "ph": user.password_hash[-12:]})
    return jsonify({"reset_token": token}), 200


@auth.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json(silent=True) or {}
    token = data.get('token') or ''
    new_password = data.get('password') or ''

    if len(new_password) < 6:
        return jsonify({"msg": "La contraseña debe tener al menos 6 caracteres"}), 400

    try:
        payload = _serializer().loads(token, max_age=current_app.config['RESET_TOKEN_MAX_AGE'])
    except SignatureExpired:
        return jsonify({"msg": "La verificación expiró. Solicita un nuevo código."}), 400
    except BadSignature:
        return jsonify({"msg": "Verificación inválida"}), 400

    user = db.session.get(User, payload.get('uid'))
    if not user or user.password_hash[-12:] != payload.get('ph'):
        return jsonify({"msg": "Verificación inválida o ya utilizada"}), 400

    user.set_password(new_password)
    db.session.commit()
    return jsonify({"msg": "Contraseña actualizada correctamente"}), 200
