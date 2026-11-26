# ─────────────────────────────────────────────────────────────────────────────
# Toolbox (sitio público de herramientas; Next.js, salida standalone).
# Contexto de build: la RAÍZ del repo, porque usa los paquetes de packages/.
#   docker build -f apps/toolbox/Dockerfile .
# No necesita base de datos ni backend: las herramientas guardan sus datos en el
# navegador del visitante.
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@10.19.0 --activate
WORKDIR /repo

# Descarga las dependencias del lockfile en una capa que solo cambia con él
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm fetch

COPY package.json tsconfig.base.json ./
COPY packages packages
COPY apps/toolbox apps/toolbox
RUN pnpm install --offline --frozen-lockfile

# Optimizador de imágenes de Next: true solo en servidores con CPU moderno (ver next.config.ts)
ARG IMAGE_OPTIMIZATION=false
ENV IMAGE_OPTIMIZATION=$IMAGE_OPTIMIZATION \
    NEXT_TELEMETRY_DISABLED=1
RUN pnpm --dir apps/toolbox run build


FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup -S app && adduser -S app -G app

# La salida standalone replica la estructura del repo: el servidor queda en apps/toolbox
COPY --from=builder --chown=app:app /repo/apps/toolbox/.next/standalone ./
COPY --from=builder --chown=app:app /repo/apps/toolbox/.next/static ./apps/toolbox/.next/static
COPY --from=builder --chown=app:app /repo/apps/toolbox/public ./apps/toolbox/public

USER app
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:3000/ || exit 1

CMD ["node", "apps/toolbox/server.js"]
