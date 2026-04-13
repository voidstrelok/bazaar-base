#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
RESET="\033[0m"

echo "====================================="
echo "  Bazaar Base — Nuevo Cliente"
echo "====================================="
echo ""

# ── Verificación de dependencias ─────────────────────────────────────────────
MISSING_DEPS=()
for cmd in docker envsubst openssl; do
    if ! command -v "$cmd" &>/dev/null; then
        MISSING_DEPS+=("$cmd")
    fi
done
# Verificar docker compose (plugin v2)
if ! docker compose version &>/dev/null 2>&1; then
    MISSING_DEPS+=("docker-compose")
fi
if [ ${#MISSING_DEPS[@]} -gt 0 ]; then
    echo -e "${RED}❌ Faltan dependencias: ${MISSING_DEPS[*]}${RESET}"
    echo "   Instálalas antes de continuar."
    exit 1
fi

# ── Solicitar datos al usuario ──────────────────────────────────────────────
# Nombre del cliente: solo letras, números y guiones, mínimo 3 caracteres
while true; do
    read -rp "Nombre del cliente (letras, números y guiones, mín. 3 chars): " CLIENT_NAME
    if [[ "$CLIENT_NAME" =~ ^[a-zA-Z0-9-]{3,}$ ]]; then
        break
    fi
    echo -e "${YELLOW}⚠️  Nombre inválido. Solo letras, números y guiones, mínimo 3 caracteres.${RESET}"
done

# Dominio: validación básica de formato
while true; do
    read -rp "Dominio del cliente (ej: mitienda.com): " DOMAIN
    if [[ "$DOMAIN" =~ ^[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,}$ ]]; then
        break
    fi
    echo -e "${YELLOW}⚠️  Dominio inválido. Usa un formato como: mitienda.com${RESET}"
done

# Función para verificar si un puerto está en uso
port_in_use() {
    local port=$1
    if command -v ss &>/dev/null; then
        ss -tlnp 2>/dev/null | grep -q ":${port}\b"
    elif command -v lsof &>/dev/null; then
        lsof -iTCP:"${port}" -sTCP:LISTEN &>/dev/null
    else
        return 1
    fi
}

# Puerto frontend
while true; do
    read -rp "Puerto frontend [3000]: " FRONTEND_PORT
    FRONTEND_PORT="${FRONTEND_PORT:-3000}"
    if ! [[ "$FRONTEND_PORT" =~ ^[0-9]+$ ]] || [ "$FRONTEND_PORT" -lt 1 ] || [ "$FRONTEND_PORT" -gt 65535 ]; then
        echo -e "${YELLOW}⚠️  Puerto inválido.${RESET}"
        continue
    fi
    if port_in_use "$FRONTEND_PORT"; then
        echo -e "${YELLOW}⚠️  El puerto $FRONTEND_PORT ya está en uso.${RESET}"
        continue
    fi
    break
done

# Puerto API
while true; do
    read -rp "Puerto API [5000]: " API_PORT
    API_PORT="${API_PORT:-5000}"
    if ! [[ "$API_PORT" =~ ^[0-9]+$ ]] || [ "$API_PORT" -lt 1 ] || [ "$API_PORT" -gt 65535 ]; then
        echo -e "${YELLOW}⚠️  Puerto inválido.${RESET}"
        continue
    fi
    if port_in_use "$API_PORT"; then
        echo -e "${YELLOW}⚠️  El puerto $API_PORT ya está en uso.${RESET}"
        continue
    fi
    break
done

# Puerto DB
while true; do
    read -rp "Puerto base de datos [1433]: " DB_PORT
    DB_PORT="${DB_PORT:-1433}"
    if ! [[ "$DB_PORT" =~ ^[0-9]+$ ]] || [ "$DB_PORT" -lt 1 ] || [ "$DB_PORT" -gt 65535 ]; then
        echo -e "${YELLOW}⚠️  Puerto inválido.${RESET}"
        continue
    fi
    if port_in_use "$DB_PORT"; then
        echo -e "${YELLOW}⚠️  El puerto $DB_PORT ya está en uso.${RESET}"
        continue
    fi
    break
done

read -rp "Nombre de la base de datos [TiendaDB]: " DB_NAME
DB_NAME="${DB_NAME:-TiendaDB}"

# SA_PASSWORD: mínimo 12 caracteres, mayúscula, número y símbolo
while true; do
    read -rsp "Contraseña SA de SQL Server (mín. 12 chars, mayúscula, número y símbolo): " SA_PASSWORD
    echo ""
    if [ -z "$SA_PASSWORD" ]; then
        echo -e "${YELLOW}⚠️  La contraseña SA no puede estar vacía.${RESET}"
        continue
    fi
    if [ "${#SA_PASSWORD}" -lt 12 ]; then
        echo -e "${YELLOW}⚠️  La contraseña debe tener al menos 12 caracteres.${RESET}"
        continue
    fi
    if ! echo "$SA_PASSWORD" | grep -q '[A-Z]'; then
        echo -e "${YELLOW}⚠️  La contraseña debe contener al menos una mayúscula.${RESET}"
        continue
    fi
    if ! echo "$SA_PASSWORD" | grep -q '[0-9]'; then
        echo -e "${YELLOW}⚠️  La contraseña debe contener al menos un número.${RESET}"
        continue
    fi
    if ! [[ "$SA_PASSWORD" =~ [^a-zA-Z0-9] ]]; then
        echo -e "${YELLOW}⚠️  La contraseña debe contener al menos un símbolo.${RESET}"
        continue
    fi
    break
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

# ── Detección de conflictos ──────────────────────────────────────────────────
CLIENT_DIR="$ROOT_DIR/clientes/$CLIENT_NAME"

if [ -d "$CLIENT_DIR" ]; then
    echo ""
    echo -e "${YELLOW}⚠️  La carpeta '$CLIENT_DIR' ya existe.${RESET}"
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
JWT_ISSUER=TiendaApi
JWT_AUDIENCE=TiendaApiUsers
JWT_EXPIRY_MINUTES=60

# Pagos
PAYMENT_GATEWAY=${PAYMENT_GATEWAY}

# Storage
STORAGE_PROVIDER=${STORAGE_PROVIDER}
CLOUDINARY_URL=${CLOUDINARY_URL}
LOCAL_STORAGE_PATH=${LOCAL_STORAGE_PATH}

# CORS
CORS_ORIGINS=http://localhost:3000
EOF

# ── Generar nginx.conf desde la plantilla ────────────────────────────────────
export DOMAIN FRONTEND_PORT API_PORT
envsubst '${DOMAIN} ${FRONTEND_PORT} ${API_PORT}' \
    < "$ROOT_DIR/nginx/nginx.conf.template" \
    > "$CLIENT_DIR/nginx.conf"

# ── Log de instalación (sin passwords) ──────────────────────────────────────
cat > "$CLIENT_DIR/INSTALL.log" <<EOF
Fecha: $(date '+%Y-%m-%d %H:%M:%S')
Cliente: ${CLIENT_NAME}
Dominio: ${DOMAIN}
Puerto frontend: ${FRONTEND_PORT}
Puerto API: ${API_PORT}
Puerto DB: ${DB_PORT}
DB Name: ${DB_NAME}
Payment gateway: ${PAYMENT_GATEWAY}
Storage provider: ${STORAGE_PROVIDER}
EOF
chmod 600 "$CLIENT_DIR/INSTALL.log"

# ── Instrucciones finales coloreadas ────────────────────────────────────────
echo ""
echo -e "${GREEN}✅ Cliente creado: ${CLIENT_NAME}${RESET}"
echo ""
echo -e "${GREEN}📁 Carpeta: clientes/${CLIENT_NAME}/${RESET}"
echo ""
echo -e "${GREEN}🚀 Para levantar:${RESET}"
echo "   cd clientes/${CLIENT_NAME}"
echo "   docker compose -p ${CLIENT_NAME} up -d"
echo ""
echo -e "${GREEN}🔒 Para obtener SSL:${RESET}"
echo "   sudo certbot --nginx -d ${DOMAIN}"
echo ""
echo -e "${GREEN}🗄️  Para ejecutar migraciones:${RESET}"
echo "   docker compose -p ${CLIENT_NAME} exec api dotnet ef database update"
echo ""
echo -e "${GREEN}📊 Swagger UI (desarrollo):${RESET}"
echo "   http://${DOMAIN}:${API_PORT}/swagger"
echo ""
