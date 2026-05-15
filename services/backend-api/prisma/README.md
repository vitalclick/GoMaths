# Prisma

Schema source of truth: `schema.prisma`. Migrations live in `migrations/`,
committed to git and applied in order.

## Local dev (first time)

```sh
# 1. Bring up a local Postgres (or point DATABASE_URL at an existing one)
docker run --name gomaths-pg -e POSTGRES_PASSWORD=devpass \
  -e POSTGRES_DB=gomaths -p 5432:5432 -d postgres:16

# 2. Set DATABASE_URL in services/backend-api/.env
echo 'DATABASE_URL="postgresql://postgres:devpass@localhost:5432/gomaths?schema=public"' \
  >> services/backend-api/.env

# 3. Apply migrations + generate the typed client
pnpm --filter @gomaths/backend-api prisma:migrate:dev
pnpm --filter @gomaths/backend-api prisma:generate
```

Once `DATABASE_URL` is set the backend's `PrismaService` switches itself
on, and `ConversationsService` starts persisting to Postgres
automatically. With it unset, services keep using in-memory stores so
the demo still runs.

## Creating a new migration

```sh
# 1. Edit schema.prisma
# 2. Generate the SQL (Prisma compares against the DB shadow and writes
#    the up migration)
pnpm --filter @gomaths/backend-api prisma migrate dev --name describe_change
```

Prisma writes `migrations/<timestamp>_describe_change/migration.sql`.
Review it in the PR — every column rename or drop should be examined
for data-loss risk before merge.

## Production

```sh
# In CI, after the image is built, before traffic shifts:
pnpm --filter @gomaths/backend-api prisma:migrate:deploy
```

`migrate deploy` applies pending migrations in order and never drops a
column. If the SQL would lose data, the team rolls a Phase 1
expand/contract migration manually instead.
