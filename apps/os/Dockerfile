# ─────────────────────────────────────────────────────────────────────────────
# Front (Next.js, salida standalone). Contexto de build: apps/os
#
# Las variables NEXT_PUBLIC_* se incorporan al COMPILAR, así que llegan como
# ARG. Cambiarlas exige reconstruir la imagen.
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@10.19.0 --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# Público (en el navegador): el API se alcanza por el mismo origen, en /api
ARG NEXT_PUBLIC_API_BASE_URL=/api
# Dominio público de la instancia (vista previa al compartir, canonical)
ARG NEXT_PUBLIC_SITE_URL=
# Optimizador de imágenes de Next: true solo en servidores con CPU moderno (ver next.config.ts)
ARG IMAGE_OPTIMIZATION=false
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    IMAGE_OPTIMIZATION=$IMAGE_OPTIMIZATION \
    NEXT_TELEMETRY_DISABLED=1
RUN pnpm run build


FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup -S app && adduser -S app -G app

COPY --from=builder --chown=app:app /app/.next/standalone ./
COPY --from=builder --chown=app:app /app/.next/static ./.next/static
COPY --from=builder --chown=app:app /app/public ./public

USER app
EXPOSE 3000

# Se consulta /auth/login y no "/": la landing responde 404 mientras la base no tiene
# negocio, y un contenedor "unhealthy" no recibe tráfico del proxy. El login siempre
# responde 200 y no depende de los datos.
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:3000/auth/login || exit 1

CMD ["node", "server.js"]
