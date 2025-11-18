# 1. Usar una imagen base oficial de Python
FROM python:3.11-slim

# 2. Establecer el directorio de trabajo
WORKDIR /usr/src/app

# 3. Instalar dependencias del sistema (para 'librosa' y 'scipy')
RUN apt-get update && apt-get install -y libsndfile1

# 4. Copiar el archivo de requisitos primero
COPY requirements.txt ./

# 5. Instalar las dependencias de Python
RUN pip install --no-cache-dir -r requirements.txt

# 6. Copiar el resto del código de la aplicación
COPY . .

# 7. Variable de entorno para que Flask encuentre la app
ENV FLASK_APP=app

# 8. --- INICIO DE CAMBIOS ---
# Copiar el nuevo script de entrada
COPY docker-entrypoint.sh /usr/src/app/docker-entrypoint.sh

# Hacerlo ejecutable
RUN chmod +x /usr/src/app/docker-entrypoint.sh

# 9. Usar ENTRYPOINT para ejecutar el script de inicio
ENTRYPOINT ["/usr/src/app/docker-entrypoint.sh"]
# --- FIN DE CAMBIOS ---