#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "====================================="
echo "  Bazaar Base — Nuevo Cliente"
echo "====================================="
echo ""

# ── Solicitar datos al usuario ──────────────────────────────────────────────
read -rp "Nombre del cliente (sin espacios, ej: mitienda): " CLIENT_NAME
read -rp "Dominio del cliente (ej: mitienda.com): " DOMAIN
read -rp "Puerto frontend [3000]: " FRONTEND_PORT
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
read -rp "Puerto API [5000]: " API_PORT
API_PORT="${API_PORT:-5000}"
read -rp "Puerto base de datos [1433]: " DB_PORT
DB_PORT="${DB_PORT:-1433}"
read -rp "Nombre de la base de datos [TiendaDB]: " DB_NAME
DB_NAME="${DB_NAME:-TiendaDB}"
read -rsp "Contraseña SA de SQL Server (requerida): " SA_PASSWORD
echo ""
while [ -z "$SA_PASSWORD" ]; do
    echo "⚠️  La contraseña SA no puede estar vacía."
    read -rsp "Contraseña SA de SQL Server (requerida): " SA_PASSWORD
    echo ""
done
read -rsp "JWT Secret (Enter para generar uno aleatorio): " JWT_SECRET
echo ""
if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET="$(openssl rand -base64 32)"
    echo "🔑 JWT Secret generado automáticamente."
fi
echo ""
read -rp "Gateway de pago (transbank|mercadopago) [transbank]: " PAYMENT_GATEWAY
PAYMENT_GATEWAY="${PAYMENT_GATEWAY:-transbank}"
read -rp "Storage provider (cloudinary|local) [cloudinary]: " STORAGE_PROVIDER
STORAGE_PROVIDER="${STORAGE_PROVIDER:-cloudinary}"

if [ "$STORAGE_PROVIDER" = "cloudinary" ]; then
    read -rp "Cloudinary URL (cloudinary://key:secret@cloud): " CLOUDINARY_URL
    CLOUDINARY_URL="${CLOUDINARY_URL:-cloudinary://api_key:api_secret@cloud_name}"
    LOCAL_STORAGE_PATH="/app/uploads"
else
    CLOUDINARY_URL="cloudinary://api_key:api_secret@cloud_name"
    read -rp "Ruta de storage local [/app/uploads]: " LOCAL_STORAGE_PATH
    LOCAL_STORAGE_PATH="${LOCAL_STORAGE_PATH:-/app/uploads}"
fi

# ── Crear carpeta del cliente ────────────────────────────────────────────────
CLIENT_DIR="$ROOT_DIR/clientes/$CLIENT_NAME"

if [ -d "$CLIENT_DIR" ]; then
    echo ""
    echo "⚠️  La carpeta '$CLIENT_DIR' ya existe."
    read -rp "¿Sobreescribir? (s/N): " OVERWRITE
    if [[ ! "$OVERWRITE" =~ ^[sS]$ ]]; then
        echo "Cancelado."
        exit 0
    fi
fi

mkdir -p "$CLIENT_DIR"

# ── Copiar archivos base ─────────────────────────────────────────────────────
cp "$ROOT_DIR/docker-compose.yml" "$CLIENT_DIR/docker-compose.yml"
cp "$ROOT_DIR/.env.example"       "$CLIENT_DIR/.env.example"

# ── Generar .env con los valores ingresados ──────────────────────────────────
cat > "$CLIENT_DIR/.env" <<EOF
# Cliente: ${CLIENT_NAME}
STORE_NAME=${CLIENT_NAME}

# Puertos
FRONTEND_PORT=${FRONTEND_PORT}
API_PORT=${API_PORT}
DB_PORT=${DB_PORT}

# Base de datos
DB_NAME=${DB_NAME}
SA_PASSWORD=${SA_PASSWORD}

# JWT
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRY_MINUTES=60

# Pagos
PAYMENT_GATEWAY=${PAYMENT_GATEWAY}

# Storage
STORAGE_PROVIDER=${STORAGE_PROVIDER}
CLOUDINARY_URL=${CLOUDINARY_URL}
LOCAL_STORAGE_PATH=${LOCAL_STORAGE_PATH}
EOF

# ── Generar nginx.conf desde la plantilla ────────────────────────────────────
export DOMAIN FRONTEND_PORT API_PORT
envsubst '${DOMAIN} ${FRONTEND_PORT} ${API_PORT}' \
    < "$ROOT_DIR/nginx/nginx.conf.template" \
    > "$CLIENT_DIR/nginx.conf"

# ── Instrucciones finales ────────────────────────────────────────────────────
echo ""
echo "====================================="
echo "  ✅  Cliente '${CLIENT_NAME}' creado"
echo "====================================="
echo ""
echo "📁 Carpeta: $CLIENT_DIR"
echo ""
echo "🚀 Levantar el stack:"
echo "   cd $CLIENT_DIR"
echo "   docker compose -p ${CLIENT_NAME} up -d"
echo ""
echo "🔐 Obtener certificado SSL (ejecutar en el host):"
echo "   certbot --nginx -d ${DOMAIN}"
echo ""
echo "🌐 Activar la configuración de Nginx:"
echo "   sudo cp $CLIENT_DIR/nginx.conf /etc/nginx/sites-available/${DOMAIN}"
echo "   sudo ln -s /etc/nginx/sites-available/${DOMAIN} /etc/nginx/sites-enabled/${DOMAIN}"
echo "   sudo nginx -t && sudo systemctl reload nginx"
echo ""
