import os
from dotenv import load_dotenv, find_dotenv
from app import create_app, db

# Carga el archivo .env desde el directorio actual (backend)
load_dotenv(find_dotenv()) 

# Crear la instancia de la aplicación
app = create_app()

# Asegurar que el contexto de la aplicación esté activo para los comandos de terminal
with app.app_context():
    pass

if __name__ == '__main__':
    # Flask ya tiene debug=True por defecto si no se especifica.
    app.run()