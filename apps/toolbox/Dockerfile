# ─────────────────────────────────────────────────────────────────────────────
# Toolbox (sitio público de herramientas; Next.js, salida standalone).
# Contexto de build: apps/toolbox. No necesita base de datos ni backend: las
# herramientas guardan sus datos en el navegador del visitante.
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@10.19.0 --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# Optimizador de imágenes de Next: true solo en servidores con CPU moderno (ver next.config.ts)
ARG IMAGE_OPTIMIZATION=false
ENV IMAGE_OPTIMIZATION=$IMAGE_OPTIMIZATION \
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

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:3000/ || exit 1

CMD ["node", "server.js"]
