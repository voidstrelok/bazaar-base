#!/bin/bash
# Uso: ./scripts/backup-db.sh {CLIENT_NAME}
# Genera un backup .bak en backups/{CLIENT_NAME}/

CLIENT_NAME=$1
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups/$CLIENT_NAME"
mkdir -p "$BACKUP_DIR"

# Leer SA_PASSWORD del .env del cliente
SA_PASSWORD=$(grep SA_PASSWORD "clientes/$CLIENT_NAME/.env" | cut -d'=' -f2)
DB_NAME=$(grep DB_NAME "clientes/$CLIENT_NAME/.env" | cut -d'=' -f2)

docker compose -p "$CLIENT_NAME" exec db /opt/mssql-tools/bin/sqlcmd \
  -S localhost -U sa -P "$SA_PASSWORD" \
  -Q "BACKUP DATABASE [$DB_NAME] TO DISK = '/var/opt/mssql/backup/${DB_NAME}_${DATE}.bak'"

# Copiar backup fuera del contenedor
docker compose -p "$CLIENT_NAME" cp "db:/var/opt/mssql/backup/${DB_NAME}_${DATE}.bak" "$BACKUP_DIR/"
echo "✅ Backup guardado en $BACKUP_DIR/${DB_NAME}_${DATE}.bak"
