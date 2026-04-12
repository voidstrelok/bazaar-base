#!/bin/bash
# Uso: ./scripts/migrate.sh {CLIENT_NAME}
# Ejecuta dotnet ef database update en el contenedor api del cliente

CLIENT_NAME=$1
if [ -z "$CLIENT_NAME" ]; then
  echo "Uso: $0 <nombre-cliente>"
  exit 1
fi

if [ ! -d "clientes/$CLIENT_NAME" ]; then
  echo "Error: no existe la carpeta clientes/$CLIENT_NAME"
  exit 1
fi

echo "Ejecutando migraciones para $CLIENT_NAME..."
docker compose -p "$CLIENT_NAME" -f "clientes/$CLIENT_NAME/docker-compose.yml" exec api dotnet ef database update
echo "✅ Migraciones completadas"
