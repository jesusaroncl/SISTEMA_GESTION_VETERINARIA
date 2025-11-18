# --- 1. Etapa de Build ---
# Usar una imagen de Node para construir la app
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

# Instalar pnpm (ya que usas pnpm-lock.yaml)
RUN npm install -g pnpm

# Copiar archivos de dependencias
COPY package.json pnpm-lock.yaml* ./

# Instalar dependencias
RUN pnpm install --frozen-lockfile

# Copiar el resto del código fuente
COPY . .

# Argumento que se pasará desde docker-compose.yml
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}

# Construir la aplicación Next.js
RUN pnpm build

# --- 2. Etapa de Producción ---
# Usar una imagen de Node más ligera
FROM node:18-alpine

WORKDIR /usr/src/app

RUN npm install -g pnpm

# Copiar solo los artefactos necesarios de la etapa de build
COPY --from=builder /usr/src/app/package.json ./package.json
COPY --from=builder /usr/src/app/.next ./.next
COPY --from=builder /usr/src/app/public ./public
COPY --from=builder /usr/src/app/node_modules ./node_modules

# Exponer el puerto 3000
EXPOSE 3000

# Comando para iniciar la aplicación en producción
CMD ["pnpm", "start"]