### 🩺 Sistema de Gestión Veterinaria (con IA)
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
│   └── Dockerfile
├── database/         # Schema de la Base de Datos
│   └── schema.sql
├── frontend/         # App Web (Next.js)
│   ├── app/
│   └── Dockerfile
└── docker-compose.yml  # Orquestador principal (el "main")
🚀 Cómo Ejecutar el Proyecto (con Docker)
Sigue estos pasos para levantar el entorno completo (Frontend, Backend y Base de Datos).

## 1. Prerrequisitos
Git

Docker Desktop (Asegúrate de que esté ejecutándose)

## 2. Clonar el Repositorio
Bash

git clone https://github.com/tu-usuario/tu-repositorio.git
cd tu-repositorio

## 3. Configuración de Variables
No se requiere crear un archivo .env. Para esta configuración de demostración, todas las variables de entorno (claves secretas, contraseñas de la base de datos) están hardcodeadas (escritas directamente) en el archivo docker-compose.yml.

⚠️ Advertencia de Seguridad: Este método no es seguro para producción. En un proyecto real, las claves secretas deben estar en un archivo .env ignorado por Git (usando .gitignore).
se creo .env.local para reutilizarlo en local sin usar docker.

## 4. Construir e Iniciar los Contenedores
Abre tu terminal en la raíz del proyecto (donde está docker-compose.yml) y ejecuta:

Bash

docker compose up --build
Docker descargará PostgreSQL, construirá tu imagen de Flask, construirá tu imagen de Next.js e iniciará los tres servicios.

## 5. Acceder a la Aplicación
¡Listo! Abre tu navegador y visita:

http://localhost:3000

🔑 Credenciales de Prueba
Una vez que el sistema esté en marcha, puedes usar los usuarios creados:

Usuario (Asistente): admin
Contraseña: admin

Usuario (Veterinario): vet_admin
Contraseña: vet123