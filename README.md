🩺 Sistema de Gestión Veterinaria (con IA)
Este es un proyecto full-stack para la gestión de una clínica veterinaria, permitiendo el manejo de propietarios, mascotas y un sistema de evaluación de soplos cardíacos basado en IA.

El sistema está completamente contenedorizado usando Docker.

### 🛠️ Tecnologías Utilizadas
Frontend: Next.js (React), TypeScript, TailwindCSS
Backend: Flask (Python), PostgreSQL, SQLAlchemy
Autenticación: Flask-JWT-Extended (Tokens JWT)
Base de Datos: PostgreSQL
IA (ML): TensorFlow/Keras, Librosa (para procesar audio)
Orquestación: Docker & Docker Compose

### 📁 Estructura del Proyecto
/
├── backend/          # API en Flask (Python)
│   ├── app/
│   ├── Dockerfile
│   └── .env          (Se creará en el Paso 3)
├── database/         # Configuración de Docker y Schema
│   └── schema.sql
├── frontend/         # App Web (Next.js)
│   ├── app/
│   └── Dockerfile
└── docker-compose.yml  # Orquestador principal (el "main")

### 🚀 Cómo Ejecutar el Proyecto (con Docker)
Sigue estos pasos para levantar el entorno completo (Frontend, Backend y Base de Datos).

## 1. Prerrequisitos
Git
Docker Desktop (Asegúrate de que esté ejecutándose)

## 2. Clonar el Repositorio
Bash
git clone https://github.com/tu-usuario/tu-repositorio.git
cd tu-repositorio

## 3. Configurar Variables de Entorno (¡Importante!)
Necesitas crear el archivo .env para el backend.

Navega a la carpeta backend:

Bash
cd backend
Crea un archivo llamado .env y copia el siguiente contenido:

### Fragmento de código

backend/.env

--- Variables para el Contenedor PostgreSQL ---
Docker-compose las usa para crear la DB
POSTGRES_USER=postgres
POSTGRES_PASSWORD=admin
POSTGRES_DB=veterinaria_db

--- Variables para el Contenedor Flask ---
¡IMPORTANTE! El host debe ser 'db' (el nombre del servicio en Docker)
DATABASE_URL="postgresql://postgres:admin@db:5432/veterinaria_db"

Claves secretas (puedes regenerarlas si lo deseas)
SECRET_KEY="77TU)y//@Z0KEK'6iA}TPFxe)3Bl\Nh,9D3\"4[eGT$48?a@JuRO(r=nT,z|Wybj"
JWT_SECRET_KEY="1257eaeb180b3127d379b72994a6a54e7793b9b58f858efe1d0174e99afc5cfb"

Variables de Flask
FLASK_APP=app
FLASK_RUN_HOST=0.0.0.0



### 4. Construir e Iniciar los Contenedores
Vuelve a la carpeta raíz del proyecto (donde está docker-compose.yml) y ejecuta:
Bash

# Vuelve a la raíz (si estabas en 'backend')
cd ..

# Construye e inicia
docker compose up --build

Docker descargará PostgreSQL, construirá tu imagen de Flask, construirá tu imagen de Next.js e iniciará los tres servicios.

### 5. Acceder a la Aplicación
¡Listo! Abre tu navegador y visita:

http://localhost:3000

### 🔑 Credenciales de Prueba
Una vez que el sistema esté en marcha, puedes usar los usuarios creados:

Usuario (Asistente): admin
Contraseña: admin

Usuario (Veterinario): vet_admin
Contraseña: vet123