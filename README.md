# 🩺 Sistema de Gestión Veterinaria (con IA)

Sistema web para clínicas veterinarias. Gestiona propietarios, perros y evaluaciones cardíacas, y clasifica soplos cardíacos (escala de Levine) a partir de un audio, usando una red neuronal (CNN).

Es **multiclínica**: varias clínicas usan el mismo sistema y cada una ve solo sus datos. Una persona (por ejemplo, un veterinario) puede trabajar en varias clínicas con una sola cuenta.

---

## Índice

1. [Tecnologías](#-tecnologías)
2. [Estructura del proyecto](#-estructura-del-proyecto)
3. [Despliegue local (desarrollo)](#-despliegue-local-desarrollo)
4. [Despliegue en producción (servidor)](#-despliegue-en-producción-servidor)
5. [Datos de prueba (seeds)](#-datos-de-prueba-seeds)
6. [Usuarios de prueba](#-usuarios-de-prueba)
7. [Roles y multiclínica](#-roles-y-multiclínica)
8. [Correo (SMTP)](#-correo-smtp)
9. [Comandos útiles](#-comandos-útiles)
10. [Problemas comunes](#-problemas-comunes)

---

## 🛠️ Tecnologías

| Parte | Tecnología |
|---|---|
| Frontend | Next.js 14 (React), TypeScript, Tailwind CSS, shadcn/ui, Recharts |
| Backend | Flask (Python 3.11), SQLAlchemy, Flask-Migrate, JWT |
| Base de datos | PostgreSQL 15 |
| IA | TensorFlow/Keras (CNN) + Librosa (audio → espectrograma) |
| Infraestructura | Docker y Docker Compose |

## 📁 Estructura del proyecto

```
/
├── backend/                  # API Flask
│   ├── app/                  # Código (modelos, rutas, modelo de IA)
│   ├── migrations/           # Migraciones de BD (se aplican solas al arrancar)
│   ├── seed_users.py         # Crea clínicas y usuarios de prueba
│   ├── seed_data.py          # Crea propietarios, perros y evaluaciones de prueba
│   └── Dockerfile
├── frontend/                 # App web Next.js
│   └── Dockerfile
├── docker-compose.yml        # Entorno LOCAL (desarrollo)
├── docker-compose.prod.yml   # Entorno de PRODUCCIÓN (servidor)
└── .env.example              # Plantilla de variables para producción
```

### Nombres de los contenedores

| Servicio | Local | Producción |
|---|---|---|
| Base de datos | `veterinaria_db` | `veterinaria_prod_db` |
| Backend (API) | `veterinaria_backend` | `veterinaria_prod_backend` |
| Frontend (web) | `veterinaria_frontend` | `veterinaria_prod_frontend` |

> En todos los comandos de esta guía, si estás en producción usa el nombre con `_prod_`.

---

## 💻 Despliegue local (desarrollo)

### Requisitos

- [Git](https://git-scm.com/)
- [Docker](https://docs.docker.com/get-docker/) con Docker Compose (Docker Desktop en Windows/Mac)
- Puertos libres: **3000** (web), **5000** (API) y **5432** (PostgreSQL)

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/jesusaroncl/SISTEMA_GESTION_VETERINARIA.git
cd SISTEMA_GESTION_VETERINARIA

# 2. Construir y levantar los 3 contenedores (la primera vez tarda varios minutos)
docker compose up -d --build

# 3. Verificar que estén corriendo
docker compose ps
```

En local **no hace falta crear un `.env`**: las variables de desarrollo ya están en `docker-compose.yml`.

Las **migraciones de la base de datos se aplican solas** cada vez que arranca el backend.

### 4. Cargar los datos de prueba (obligatorio la primera vez)

La base de datos empieza vacía y **sin usuarios no se puede iniciar sesión**. Ejecuta los seeds **en este orden**:

```bash
docker exec veterinaria_backend python3 seed_users.py   # clínicas y usuarios
docker exec veterinaria_backend python3 seed_data.py    # propietarios, perros y evaluaciones
```

### 5. Entrar

- Web: **http://localhost:3000**
- API: http://localhost:5000

Inicia sesión con cualquiera de los [usuarios de prueba](#-usuarios-de-prueba).

---

## 🚀 Despliegue en producción (servidor)

Pensado para un servidor con Docker y **Nginx Proxy Manager** (NPM) delante, que se encarga del dominio y el HTTPS.

```
Internet ──► Nginx Proxy Manager ──► :7000  frontend (Next.js)
                                 └─► :9000  backend  (Flask/Gunicorn) ──► PostgreSQL
```

### 1. Clonar y configurar variables

```bash
git clone https://github.com/jesusaroncl/SISTEMA_GESTION_VETERINARIA.git
cd SISTEMA_GESTION_VETERINARIA
cp .env.example .env
nano .env        # edita los valores
```

Variables del `.env`:

| Variable | Qué es | Ejemplo |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | URL pública del backend, **sin barra final** | `https://api.vet.tudominio.com` |
| `FRONTEND_PORT` / `BACKEND_PORT` | Puertos del servidor a los que apunta NPM | `7000` / `9000` |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Credenciales de PostgreSQL | usa una contraseña fuerte |
| `SECRET_KEY` / `JWT_SECRET_KEY` | Claves secretas (largas y aleatorias) | ver comando abajo |
| `FRONTEND_URL` | URL pública de la web (para los enlaces de invitación) | `https://vet.tudominio.com` |
| `SMTP_*` | Servidor de correo (opcional, ver [Correo](#-correo-smtp)) | — |

Para generar claves secretas seguras:

```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

> ⚠️ `NEXT_PUBLIC_API_BASE_URL` se graba en el frontend **al construirlo**. Si la cambias, vuelve a construir el frontend (`... up -d --build frontend`).

### 2. Levantar

```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
docker compose -f docker-compose.prod.yml --env-file .env ps
```

### 3. Cargar los usuarios y datos de prueba

```bash
docker exec veterinaria_prod_backend python3 seed_users.py
docker exec veterinaria_prod_backend python3 seed_data.py
```

> ⚠️ Los usuarios de prueba tienen una contraseña conocida (`Demo#2026`). En un sistema con datos reales, cámbiala
> (con "¿Olvidaste tu contraseña?") o ejecuta el seed con tu propia contraseña:
> `docker exec -e SEED_PASSWORD='otra_clave' veterinaria_prod_backend python3 seed_users.py`

### 4. Configurar Nginx Proxy Manager

Crea **2 Proxy Hosts**:

| | Dominio | Forward a | SSL |
|---|---|---|---|
| Web | `vet.tudominio.com` | `http://IP_DEL_SERVIDOR:7000` | Let's Encrypt, Websockets ON |
| API | `api.vet.tudominio.com` | `http://IP_DEL_SERVIDOR:9000` | Let's Encrypt |

En el Proxy Host de la **API**, en *Advanced → Custom Nginx Configuration* (el análisis de audio puede tardar):

```nginx
proxy_read_timeout 180s;
proxy_send_timeout 180s;
client_max_body_size 50M;
```

### 5. Actualizar a una nueva versión

```bash
cd SISTEMA_GESTION_VETERINARIA
git pull
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

Los datos se conservan (están en volúmenes de Docker) y las migraciones nuevas se aplican solas.

> ⚠️ No cambies el nombre de la carpeta del proyecto ni agregues `name:` al compose de producción:
> Docker usa ese nombre para los volúmenes y la base de datos aparecería vacía.

---

## 🌱 Datos de prueba (seeds)

| Script | Qué crea | Orden |
|---|---|---|
| `seed_users.py` | 2 clínicas (Clínica Demo y Clínica Norte) y 5 usuarios | **1º** |
| `seed_data.py` | 7 propietarios, 15 perros y 58 evaluaciones en la Clínica Demo | **2º** |

- Se pueden ejecutar **varias veces** sin duplicar nada.
- `seed_users.py` **nunca cambia la contraseña** de un usuario que ya existe.
- `seed_data.py` no hace nada si la Clínica Demo ya tiene propietarios.

## 🔑 Usuarios de prueba

Contraseña de todos: **`Demo#2026`**

| Usuario | Rol | Clínica | Para probar |
|---|---|---|---|
| `admin_demo` | Administrador | Clínica Demo | Panel de administración, invitar integrantes |
| `vet_demo` | Veterinario | Clínica Demo | Dashboard, evaluación de audio con IA |
| `asistente_demo` | Asistente | Clínica Demo | Registro de propietarios y perros |
| `admin_norte` | Administrador | Clínica Norte | Ver que otra clínica no ve los datos de la Demo |
| `vet_multi` | Veterinario | Clínica Demo **y** Clínica Norte | Selector de clínica al iniciar sesión |

---

## 👥 Roles y multiclínica

| Rol | Puede |
|---|---|
| **Administrador** | Invitar veterinarios y asistentes por correo, ver el equipo y quitar integrantes de su clínica |
| **Asistente** | Registrar y editar propietarios y perros |
| **Veterinario** | Ver pacientes, evaluar audios con la IA y ver el dashboard estadístico |

- **Registrar una clínica nueva:** en la pantalla de inicio, *"Registrar clínica"*. Se crea la clínica con su administrador.
- **Agregar personas:** el administrador las **invita por correo** desde su panel. Si la persona ya tiene cuenta (porque trabaja en otra clínica), solo confirma con su contraseña. Si no la tiene, crea su usuario desde el enlace.
- **Privacidad entre clínicas:** una clínica nunca ve datos de otra, ni sabe si una persona trabaja en otra clínica.
- **Varias clínicas:** quien pertenece a más de una elige con cuál trabajar al iniciar sesión, y puede cambiar desde el nombre de la clínica en la barra superior.
- **Quitar a alguien** solo lo saca de esa clínica, y pierde el acceso al instante. Su cuenta y sus otras clínicas no se tocan.

## 📧 Correo (SMTP)

El sistema envía correos para las **invitaciones** y la **recuperación de contraseña**. Funciona con cualquier servidor SMTP (Gmail con contraseña de aplicación, Brevo, Resend, etc.). Configúralo en el `.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_correo@gmail.com
SMTP_PASSWORD=contraseña_de_aplicación
SMTP_FROM=tu_correo@gmail.com
```

**Sin SMTP el sistema funciona igual**, pero los correos no se envían: el enlace de invitación y el código de recuperación quedan en los logs del backend. Para obtenerlos:

```bash
# Último enlace de invitación
docker logs veterinaria_backend 2>&1 | grep "invitacion?token=" | tail -1

# Último código de recuperación de contraseña
docker logs veterinaria_backend 2>&1 | grep "Código de recuperación" -A 3 | tail -4
```

---

## 🧰 Comandos útiles

> Ejemplos para **local**. En producción usa `veterinaria_prod_*` y añade `-f docker-compose.prod.yml --env-file .env` a los comandos `docker compose`.

```bash
# Ver logs en vivo
docker logs -f veterinaria_backend
docker logs -f veterinaria_frontend

# Reiniciar / detener / levantar
docker compose restart backend
docker compose down          # detiene todo (los datos se conservan)
docker compose up -d

# Reconstruir después de cambiar código
docker compose up -d --build

# Entrar a la base de datos
docker exec -it veterinaria_db psql -U postgres -d veterinaria_db

# Respaldo de la base de datos
docker exec veterinaria_db pg_dump -U postgres -Fc veterinaria_db > respaldo_$(date +%F).dump

# Restaurar un respaldo (BORRA los datos actuales)
docker compose stop backend
docker exec veterinaria_db psql -U postgres -c "DROP DATABASE veterinaria_db WITH (FORCE)" -c "CREATE DATABASE veterinaria_db"
docker exec -i veterinaria_db pg_restore -U postgres -d veterinaria_db --no-owner < respaldo.dump
docker compose start backend
```

> ⚠️ `docker compose down -v` **borra los volúmenes** (toda la base de datos). No lo uses salvo que quieras empezar de cero.

## 🩹 Problemas comunes

| Síntoma | Causa / solución |
|---|---|
| No puedo iniciar sesión con ningún usuario | La base está vacía: ejecuta `seed_users.py` ([ver arriba](#-datos-de-prueba-seeds)) |
| `port is already allocated` | Otro programa usa el puerto 3000, 5000 o 5432. Ciérralo o cambia el puerto en el compose |
| La web carga pero dice *"No se pudo conectar con el servidor"* | `NEXT_PUBLIC_API_BASE_URL` apunta a una URL incorrecta. Corrígela y reconstruye el frontend |
| El backend se reinicia en bucle | Revisa `docker logs veterinaria_backend`. Suele ser una variable faltante en `.env` o la BD aún arrancando |
| El análisis de audio da *timeout* en producción | Falta la configuración de timeouts en el Proxy Host de la API (ver paso 4 de producción) |
| No llegan los correos de invitación | No hay SMTP configurado: toma el enlace de los logs ([ver Correo](#-correo-smtp)) |
