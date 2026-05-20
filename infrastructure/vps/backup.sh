#!/usr/bin/env bash
# Nightly Postgres backup for the GoMaths VPS deployment.
#
# Dumps the gomaths database to /var/backups/gomaths/, gzipped, with
# a 14-day retention. Run from cron as the gomaths user:
#
#   crontab -e
#   # m h dom mon dow command
#   30 3 * * * /home/gomaths/GoMaths/infrastructure/vps/backup.sh >> /var/log/gomaths-backup.log 2>&1
#
# For off-VPS backups (recommended before going live), pipe the dump
# to rclone / aws-cli / restic and ship to S3 / B2 / similar. The dump
# itself is plain SQL — restore with:
#
#   gunzip -c gomaths-YYYY-MM-DD.sql.gz | \
#     docker compose -f docker-compose.prod.yml exec -T postgres psql -U gomaths gomaths

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/gomaths}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
COMPOSE_FILE="${COMPOSE_FILE:-$HOME/GoMaths/docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-$HOME/GoMaths/.env.production}"

mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date -u +%Y-%m-%dT%H-%M-%SZ)
OUT="$BACKUP_DIR/gomaths-$TIMESTAMP.sql.gz"

echo "[$TIMESTAMP] dumping to $OUT"
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T postgres \
  pg_dump -U gomaths --clean --if-exists gomaths | gzip -9 > "$OUT"

# Verify the dump isn't empty.
if [ ! -s "$OUT" ]; then
  echo "ERROR: backup is empty, deleting" >&2
  rm -f "$OUT"
  exit 1
fi

echo "[$TIMESTAMP] backup ok: $(du -h "$OUT" | cut -f1)"

# Prune old backups.
find "$BACKUP_DIR" -name 'gomaths-*.sql.gz' -mtime "+$RETENTION_DAYS" -delete -print
