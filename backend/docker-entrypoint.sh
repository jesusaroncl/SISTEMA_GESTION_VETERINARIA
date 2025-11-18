#!/bin/sh

# 'set -e' hace que el script falle si cualquier comando falla
set -e

echo "--- Esperando a que PostgreSQL (db) esté saludable (healthcheck)... ---"
# (Docker Compose se encarga de la espera gracias a 'condition: service_healthy')

echo "--- Ejecutando Migraciones de Base de Datos (flask db upgrade) ---"
flask db upgrade

# Si el comando 'upgrade' falla, el 'set -e' detendrá el script aquí.

echo "--- Iniciando Servidor Flask (flask run) ---"
exec flask run --host=0.0.0.0 --port=5000