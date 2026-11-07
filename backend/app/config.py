import os

class Config:
    # Usamos 'veterinaria' como nombre de la DB en el respaldo (fallback)
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    # Descarta conexiones muertas (p. ej. tras reiniciar el contenedor de la BD)
    SQLALCHEMY_ENGINE_OPTIONS = {'pool_pre_ping': True}
    
    SECRET_KEY = os.environ.get('SECRET_KEY')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY')

    # Recuperación de contraseña
    RESET_TOKEN_MAX_AGE = 900  # segundos
    SMTP_HOST = os.environ.get('SMTP_HOST')
    SMTP_PORT = int(os.environ.get('SMTP_PORT', 587))
    SMTP_USER = os.environ.get('SMTP_USER')
    SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD')
    SMTP_FROM = os.environ.get('SMTP_FROM') or os.environ.get('SMTP_USER')

    # URL pública del frontend (enlaces de invitación en los correos)
    FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
