#!/bin/bash
# Uso: ./scripts/migrate.sh {CLIENT_NAME}
# Las migraciones se aplican automáticamente al iniciar la API.

CLIENT_NAME=$1
if [ -z "$CLIENT_NAME" ]; then
  echo "Uso: $0 <nombre-cliente>"
  exit 1
fi

if [ ! -d "clientes/$CLIENT_NAME" ]; then
  echo "Error: no existe la carpeta clientes/$CLIENT_NAME"
  exit 1
fi

echo "Recreando la API para aplicar migraciones de $CLIENT_NAME..."
docker compose -p "$CLIENT_NAME" -f "clientes/$CLIENT_NAME/docker-compose.yml" up -d api
docker compose -p "$CLIENT_NAME" -f "clientes/$CLIENT_NAME/docker-compose.yml" ps api
echo "✅ La API fue iniciada; revisar healthcheck y logs si hay una migración pendiente."
