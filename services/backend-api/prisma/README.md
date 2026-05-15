# Prisma

Schema source of truth: `schema.prisma`. Migrations live in `migrations/`,
committed to git and applied in order.

## Local dev (first time)

```sh
# 1. Start Postgres (Docker)
pnpm --filter @gomaths/backend-api db:up

# 2. Set DATABASE_URL
cat >> services/backend-api/.env <<'EOF'
DATABASE_URL="postgresql://gomaths:devpass@localhost:5432/gomaths?schema=public"
EOF

# 3. Apply migrations + generate client
pnpm --filter @gomaths/backend-api prisma:migrate:deploy
pnpm --filter @gomaths/backend-api prisma:generate

# 4. Seed curriculum from curriculum-data/
pnpm --filter @gomaths/backend-api prisma:seed
```

Once `DATABASE_URL` is set the backend's `PrismaService` switches itself
on, and every service that has a dual-mode store (Users, Sessions,
Progress, Conversations) starts persisting to Postgres automatically.
With it unset, services keep using in-memory stores so demos still run.

## Creating a new migration

```sh
# 1. Edit schema.prisma
# 2. Generate the SQL
pnpm --filter @gomaths/backend-api prisma migrate dev --name describe_change
```

Prisma writes `migrations/<timestamp>_describe_change/migration.sql`.
**Review every column rename or drop in the PR** — a Phase 1
expand/contract migration is required for anything data-lossy.

## Production

```sh
# In CI, after the image is built, before traffic shifts:
pnpm --filter @gomaths/backend-api prisma:migrate:deploy
pnpm --filter @gomaths/backend-api prisma:seed  # idempotent
```

## Tearing down local dev

```sh
pnpm --filter @gomaths/backend-api db:down   # stop the container
# Volume `gomaths-pgdata` persists across `db:down` — remove with:
docker volume rm gomaths-pgdata
```
