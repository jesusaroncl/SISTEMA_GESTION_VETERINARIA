import hashlib
import hmac
import secrets
import datetime
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from app import db
from app.emails import send_email
from app.models import User, Clinic, ClinicMembership, ClinicInvitation
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
        admin = User(username=username, email=email)
        admin.set_password(password)
        membership = ClinicMembership(user=admin, clinic=clinic, role='administrador')
        db.session.add_all([clinic, admin, membership])
        db.session.commit()
        return jsonify({"msg": f"Clínica {nombre} registrada. Ya puedes iniciar sesión."}), 201
    except IntegrityError:
        db.session.rollback()
        return jsonify({"msg": "El RUC, usuario o correo ya están en uso"}), 409
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": "Error interno del servidor", "error": str(e)}), 500


SELECT_TOKEN_MAX_AGE = 300  # segundos para elegir clínica tras el login


def _session_payload(user, membership):
    """Respuesta de sesión: token ligado a la clínica elegida."""
    return {
        "access_token": user.get_jwt(membership),
        "userRole": membership.role,
        "username": user.username,
        "clinicName": membership.clinic.nombre,
        "clinicCount": len(user.memberships),
    }


def _clinic_options(user):
    return [
        {"id": m.clinic_id, "nombre": m.clinic.nombre, "role": m.role}
        for m in sorted(user.memberships, key=lambda m: m.clinic.nombre.lower())
    ]


def _select_serializer():
    return URLSafeTimedSerializer(current_app.config['SECRET_KEY'], salt='clinic-select')


def _membership(user_id, clinic_id):
    return db.session.execute(
        db.select(ClinicMembership).filter_by(user_id=user_id, clinic_id=clinic_id)
    ).scalar_one_or_none()


@auth.route('/login', methods=['POST'])
def login():
    data = request.get_json(silent=True) or {}
    username = data.get('username')
    password = data.get('password')
    
    user = db.session.execute(db.select(User).filter_by(username=username)).scalar_one_or_none()

    if not user or not user.check_password(password or ''):
        return jsonify({"msg": "Credenciales inválidas"}), 401

    if not user.memberships:
        return jsonify({"msg": "Tu cuenta no pertenece a ninguna clínica. Pide una invitación al administrador."}), 403

    if len(user.memberships) == 1:
        return jsonify(_session_payload(user, user.memberships[0])), 200

    # Varias clínicas: se devuelve un token corto solo para elegir con cuál trabajar
    select_token = _select_serializer().dumps({"uid": user.id, "ph": user.password_hash[-12:]})
    return jsonify({"selectClinic": True, "selectToken": select_token, "clinics": _clinic_options(user)}), 200


@auth.route('/select-clinic', methods=['POST'])
def select_clinic():
    data = request.get_json(silent=True) or {}
    try:
        payload = _select_serializer().loads(data.get('selectToken') or '', max_age=SELECT_TOKEN_MAX_AGE)
    except (BadSignature, SignatureExpired):
        return jsonify({"msg": "La sesión expiró. Vuelve a iniciar sesión."}), 401

    user = db.session.get(User, payload.get('uid'))
    if not user or user.password_hash[-12:] != payload.get('ph'):
        return jsonify({"msg": "La sesión expiró. Vuelve a iniciar sesión."}), 401

    membership = _membership(user.id, data.get('clinicId'))
    if not membership:
        return jsonify({"msg": "Clínica no válida"}), 403
    return jsonify(_session_payload(user, membership)), 200


@auth.route('/my-clinics', methods=['GET'])
@jwt_required()
def my_clinics():
    user = db.session.get(User, int(get_jwt()['sub']))
    if not user:
        return jsonify({"msg": "Usuario no encontrado"}), 404
    return jsonify({"activeClinicId": get_jwt().get('clinic_id'), "clinics": _clinic_options(user)}), 200


@auth.route('/switch-clinic', methods=['POST'])
@jwt_required()
def switch_clinic():
    data = request.get_json(silent=True) or {}
    user = db.session.get(User, int(get_jwt()['sub']))
    membership = _membership(user.id, data.get('clinicId')) if user else None
    if not membership:
        return jsonify({"msg": "Clínica no válida"}), 403
    return jsonify(_session_payload(user, membership)), 200


# ===================================================
# --- Invitaciones (enlace público con token) ---
# ===================================================

def hash_invite_token(token):
    return hashlib.sha256(f"{current_app.config['SECRET_KEY']}:invite:{token}".encode()).hexdigest()


def _pending_invitation(token):
    inv = db.session.execute(
        db.select(ClinicInvitation).filter_by(token_hash=hash_invite_token(token or ''))
    ).scalar_one_or_none()
    if not inv or inv.accepted_at or inv.expires_at < datetime.datetime.utcnow():
        return None
    return inv


@auth.route('/invitations/<string:token>', methods=['GET'])
def get_invitation(token):
    """Datos para la pantalla de aceptación. Solo los ve quien tiene el enlace (el invitado)."""
    inv = _pending_invitation(token)
    if not inv:
        return jsonify({"msg": "La invitación no es válida o ya expiró"}), 404
    has_account = db.session.execute(db.select(User.id).filter_by(email=inv.email)).first() is not None
    return jsonify({
        "clinicName": inv.clinic.nombre,
        "role": inv.role,
        "email": inv.email,
        "hasAccount": has_account,
    }), 200


@auth.route('/invitations/<string:token>/accept', methods=['POST'])
def accept_invitation(token):
    inv = _pending_invitation(token)
    if not inv:
        return jsonify({"msg": "La invitación no es válida o ya expiró"}), 404

    data = request.get_json(silent=True) or {}
    password = data.get('password') or ''
    user = db.session.execute(db.select(User).filter_by(email=inv.email)).scalar_one_or_none()

    if user:
        # Cuenta existente: debe demostrar que es suya con su contraseña
        if not user.check_password(password):
            return jsonify({"msg": "Contraseña incorrecta"}), 401
    else:
        username = (data.get('username') or '').strip()
        if not username:
            return jsonify({"msg": "Elige un nombre de usuario"}), 400
        if len(password) < 6:
            return jsonify({"msg": "La contraseña debe tener al menos 6 caracteres"}), 400
        if db.session.execute(db.select(User.id).filter_by(username=username)).first():
            return jsonify({"msg": "Ese nombre de usuario no está disponible, elige otro"}), 409
        user = User(username=username, email=inv.email)
        user.set_password(password)
        db.session.add(user)

    membership = _membership(user.id, inv.clinic_id) if user.id else None
    if not membership:
        membership = ClinicMembership(user=user, clinic_id=inv.clinic_id, role=inv.role)
        db.session.add(membership)
    inv.accepted_at = datetime.datetime.utcnow()

    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"msg": "Ese nombre de usuario no está disponible, elige otro"}), 409

    db.session.refresh(user)
    return jsonify(_session_payload(user, membership)), 200


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
    send_email(
        user.email,
        'Código de recuperación - Sistema de Gestión Veterinaria',
        f"Hola {user.username},\n\nTu código de recuperación es: {code}\n\n"
        "Es válido por 10 minutos. Si no lo solicitaste, ignora este mensaje.",
    )


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
