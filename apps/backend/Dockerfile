# syntax=docker/dockerfile:1
# Build context MUST be the monorepo root (npm workspaces).
#   docker build -f apps/backend/Dockerfile --build-arg NODE_VERSION=24 -t buu-get-api .

ARG NODE_VERSION=24

# ─── Build ───────────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION}-alpine AS builder

RUN apk add --no-cache python3 make g++ tzdata

WORKDIR /app

ENV HUSKY=0
ENV CI=true

COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/

# node:*-alpine ships npm 10; engines require npm >= 11 for this lockfile.
# Workspace-only ci: installing the whole monorepo (frontend too) fills DinD (ENOSPC).
# Skip npm prune here — overlay2 whiteouts during prune also ENOSPC on small DinD disks.
RUN npm install -g npm@11 \
  && npm ci --ignore-scripts --workspace=buu-get-back --include-workspace-root \
  && npm rebuild bcrypt --workspace=buu-get-back

COPY apps/backend ./apps/backend

RUN npm run build --workspace=buu-get-back

# ─── Runtime ─────────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION}-alpine AS runner

ARG APP_VERSION=

RUN apk add --no-cache tzdata curl \
  && cp /usr/share/zoneinfo/Asia/Bangkok /etc/localtime \
  && echo "Asia/Bangkok" > /etc/timezone \
  && addgroup -S app && adduser -S app -G app

WORKDIR /app

ENV NODE_ENV=production
ENV TZ=Asia/Bangkok
ENV PORT=3000
ENV HUSKY=0
ENV APP_VERSION=${APP_VERSION}

COPY --from=builder --chown=app:app /app/package.json /app/package-lock.json ./
COPY --from=builder --chown=app:app /app/node_modules ./node_modules
COPY --from=builder --chown=app:app /app/apps/backend/package.json ./apps/backend/
COPY --from=builder --chown=app:app /app/apps/backend/dist ./apps/backend/dist
# Node resolves modules by walking up to /app/node_modules (npm workspaces hoist).

WORKDIR /app/apps/backend

USER app

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=90s --retries=3 \
  CMD curl -fsS "http://127.0.0.1:${PORT}/api/health" || exit 1

CMD ["node", "dist/main.js"]
