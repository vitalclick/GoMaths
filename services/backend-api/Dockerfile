# Backend API — multi-stage build.
#
# Build context MUST be the repo root (pnpm-workspace.yaml + lockfile +
# workspace packages live above this file). Build from the repo root:
#
#   docker build -f services/backend-api/Dockerfile -t gomaths-backend .
#
# Or via Fly: `fly deploy -c fly.backend.toml` (which sets the right
# context for you).

ARG NODE_VERSION=20.10.0
ARG PNPM_VERSION=9.12.0

# ─── stage 1: deps + build ──────────────────────────────────────────────
FROM node:${NODE_VERSION}-slim AS builder

ARG PNPM_VERSION

# Build deps for bcrypt + Prisma engines. Prisma needs openssl.
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      python3 make g++ openssl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

WORKDIR /repo

# Copy package manifests first so the install layer caches when only
# source changes.
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json tsconfig.base.json turbo.json ./

# Workspace packages the backend depends on.
COPY packages/types/package.json packages/types/
COPY packages/api-client/package.json packages/api-client/
COPY services/backend-api/package.json services/backend-api/

# Install everything (frozen). Includes dev deps — we need nest+tsc to build.
RUN pnpm install --frozen-lockfile --filter @gomaths/backend-api...

# Copy source.
COPY packages/types ./packages/types
COPY packages/api-client ./packages/api-client
COPY services/backend-api ./services/backend-api

# Generate Prisma client + build.
RUN pnpm --filter @gomaths/backend-api prisma:generate \
 && pnpm --filter @gomaths/backend-api build

# `pnpm deploy` produces a standalone tree with hoisted deps. We
# DON'T pass --prod because the boot-time `prisma migrate deploy` needs
# the Prisma CLI, which lives in devDependencies. A production split
# would either (a) move prisma to dependencies, or (b) run migrations
# from a separate release-command image. Either is fine; preview keeps
# it simple at the cost of ~80MB.
RUN pnpm deploy --filter @gomaths/backend-api /app

# pnpm deploy creates a fresh node_modules at /app; the Prisma client
# generated above lives in the workspace tree and is not copied. Re-run
# generate inside the deployed directory so the .prisma/client artefact
# is present at runtime.
WORKDIR /app
RUN ./node_modules/.bin/prisma generate

# ─── stage 2: runtime ───────────────────────────────────────────────────
FROM node:${NODE_VERSION}-slim AS runner

# OpenSSL needed at runtime for Prisma's query engine binary.
RUN apt-get update && \
    apt-get install -y --no-install-recommends openssl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Run as non-root.
RUN groupadd --system --gid 1001 app && \
    useradd --system --uid 1001 --gid app --create-home --home-dir /home/app app

WORKDIR /app

COPY --from=builder --chown=app:app /app /app
# Bundle the migrations so prisma migrate deploy works at boot.
COPY --from=builder --chown=app:app /repo/services/backend-api/prisma /app/prisma
# Curriculum is filesystem-loaded at boot. CURRICULUM_ROOT (below) tells
# the service where to find it.
COPY --chown=app:app curriculum-data /app/curriculum-data

USER app

ENV NODE_ENV=production
ENV PORT=8080
ENV CURRICULUM_ROOT=/app/curriculum-data
EXPOSE 8080

# Run migrations then start the API. Fly will restart on non-zero exit
# so a transient DB outage at boot is self-healing.
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && node dist/main.js"]
