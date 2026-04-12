#!/bin/bash
# Uso: ./scripts/backup-db.sh {CLIENT_NAME}
# Genera un backup .bak en backups/{CLIENT_NAME}/

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

# Leer SA_PASSWORD del .env del cliente
SA_PASSWORD=$(grep '^SA_PASSWORD=' "$ENV_FILE" | cut -d'=' -f2-)
DB_NAME=$(grep '^DB_NAME=' "$ENV_FILE" | cut -d'=' -f2-)

if [ -z "$SA_PASSWORD" ] || [ -z "$DB_NAME" ]; then
  echo "Error: SA_PASSWORD o DB_NAME no encontrados en $ENV_FILE"
  exit 1
fi

docker compose -p "$CLIENT_NAME" exec db /opt/mssql-tools/bin/sqlcmd \
  -S localhost -U sa -P "$SA_PASSWORD" \
  -Q "BACKUP DATABASE [$DB_NAME] TO DISK = '/var/opt/mssql/backup/${DB_NAME}_${DATE}.bak'"

# Copiar backup fuera del contenedor
docker compose -p "$CLIENT_NAME" cp "db:/var/opt/mssql/backup/${DB_NAME}_${DATE}.bak" "$BACKUP_DIR/"
echo "✅ Backup guardado en $BACKUP_DIR/${DB_NAME}_${DATE}.bak"
