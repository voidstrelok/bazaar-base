#!/bin/bash
# Uso: ./scripts/backup-db.sh {CLIENT_NAME}
# Genera un backup PostgreSQL comprimido en backups/{CLIENT_NAME}/

CLIENT_NAME=$1
if [ -z "$CLIENT_NAME" ]; then
  echo "Uso: $0 <nombre-cliente>"
  exit 1
fi

if [ ! -d "clientes/$CLIENT_NAME" ]; then
  echo "Error: no existe la carpeta clientes/$CLIENT_NAME"
  exit 1
fi

ENV_FILE="clientes/$CLIENT_NAME/.env"
if [ ! -f "$ENV_FILE" ]; then
  echo "Error: no existe el archivo $ENV_FILE"
  exit 1
fi

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups/$CLIENT_NAME"
mkdir -p "$BACKUP_DIR"

# Leer credenciales PostgreSQL del .env del cliente
POSTGRES_PASSWORD=$(grep '^POSTGRES_PASSWORD=' "$ENV_FILE" | cut -d'=' -f2-)
DB_NAME=$(grep '^DB_NAME=' "$ENV_FILE" | cut -d'=' -f2-)

if [ -z "$POSTGRES_PASSWORD" ] || [ -z "$DB_NAME" ]; then
  echo "Error: POSTGRES_PASSWORD o DB_NAME no encontrados en $ENV_FILE"
  exit 1
fi

BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${DATE}.dump"
docker compose -p "$CLIENT_NAME" -f "clientes/$CLIENT_NAME/docker-compose.yml" exec -T \
  -e PGPASSWORD="$POSTGRES_PASSWORD" db \
  pg_dump -U postgres -d "$DB_NAME" --format=custom --file=- > "$BACKUP_FILE"

chmod 600 "$BACKUP_FILE"
echo "✅ Backup PostgreSQL guardado en $BACKUP_FILE"
