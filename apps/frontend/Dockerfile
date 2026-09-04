# syntax=docker/dockerfile:1
# Build context MUST be the monorepo root (Quasar envFolder = monorepo root).
#   docker build -f apps/frontend/Dockerfile --build-arg NODE_VERSION=22 --build-arg API_BASE_URL=/api -t buu-get-web .

ARG NODE_VERSION=22

# ─── Build ───────────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION}-alpine AS builder

WORKDIR /app

ARG API_BASE_URL=/api
ENV API_BASE_URL=${API_BASE_URL}
ENV HUSKY=0
ENV CI=true

COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/

RUN npm ci --ignore-scripts

COPY apps/frontend ./apps/frontend

RUN npm run postinstall --workspace=buu-get-front \
  && npm run build --workspace=buu-get-front

# ─── Runtime (static SPA) ────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runner

COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/frontend/dist/spa /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
