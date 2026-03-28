#!/bin/bash
# ─── TEEMS Database Backup Script ────────────────────────────
# Usage: ./scripts/backup.sh
# Cron:  0 2 * * * /path/to/teems/scripts/backup.sh
# Keeps last 30 daily backups

set -euo pipefail

DB_URL="${DATABASE_URL:-postgresql://teems:teems@localhost:5432/teems}"
BACKUP_DIR="${BACKUP_DIR:-/app/data/backups}"
RETENTION_DAYS=30
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/teems_${TIMESTAMP}.sql.gz"

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting backup..."

# Dump and compress
pg_dump "$DB_URL" | gzip > "$BACKUP_FILE"

# Verify backup is not empty
if [ ! -s "$BACKUP_FILE" ]; then
  echo "[$(date)] ERROR: Backup file is empty!"
  rm -f "$BACKUP_FILE"
  exit 1
fi

SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "[$(date)] Backup complete: $BACKUP_FILE ($SIZE)"

# Cleanup old backups
DELETED=$(find "$BACKUP_DIR" -name "teems_*.sql.gz" -mtime +${RETENTION_DAYS} -delete -print | wc -l)
if [ "$DELETED" -gt 0 ]; then
  echo "[$(date)] Cleaned up $DELETED old backup(s)"
fi

echo "[$(date)] Done. Active backups:"
ls -lh "$BACKUP_DIR"/teems_*.sql.gz 2>/dev/null | tail -5
