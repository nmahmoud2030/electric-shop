#!/bin/sh
set -e
STAMP=$(date +%Y%m%d_%H%M%S)
DIR=/backups
mkdir -p "$DIR/finance" "$DIR/goods" "$DIR/dumps"
pg_dump -h db -U electric -d electric_shop -Fc -f "$DIR/dumps/electric_shop_$STAMP.dump"
# Keep last 30 dumps
ls -1t "$DIR/dumps"/*.dump 2>/dev/null | tail -n +31 | xargs -r rm --
echo "Backup complete: $STAMP"
