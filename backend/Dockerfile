# 1. Usar una imagen base oficial de Python
FROM python:3.11-slim

# 2. Establecer el directorio de trabajo
WORKDIR /usr/src/app

# 3. Instalar dependencias del sistema (para 'librosa' y 'scipy')
# libsndfile1 es necesaria para leer archivos de audio
RUN apt-get update && apt-get install -y libsndfile1

# 4. Copiar el archivo de requisitos primero (para caché de Docker)
COPY requirements.txt ./

# 5. Instalar las dependencias de Python
RUN pip install --no-cache-dir -r requirements.txt

# 6. Copiar el resto del código de la aplicación
# (Copia todo el contenido de 'backend/' al contenedor '/usr/src/app')
COPY . .

# 7. Exponer el puerto en el que corre Flask
EXPOSE 5000

# 8. Variable de entorno para que Flask encuentre la app
ENV FLASK_APP=app

# 9. Comando para iniciar el servidor
# Se usa --host=0.0.0.0 para que sea accesible desde fuera del contenedor
CMD ["flask", "run", "--host=0.0.0.0"]