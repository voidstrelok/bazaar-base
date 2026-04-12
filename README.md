# Bazaar Base 🛍️

Monorepo base para una tienda virtual replicable por cliente. Cada cliente corre como un stack Docker independiente bajo su propio dominio con SSL automático via Certbot.

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | ASP.NET Core Web API (.NET 8) |
| Base de datos | SQL Server 2022 |
| Reverse proxy | Nginx (en host) |
| Contenedores | Docker Compose por cliente |
| SSL | Certbot (en host, fuera de Docker) |

---

## Requisitos Previos

- [Docker](https://docs.docker.com/get-docker/) y Docker Compose v2
- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0) (para desarrollo local de la API)
- [Node.js 20](https://nodejs.org/) (para desarrollo local del frontend)
- Nginx instalado en el host (`sudo apt install nginx`)
- Certbot instalado en el host (`sudo apt install certbot python3-certbot-nginx`)

---

## Estructura del Repositorio

```
/
├── frontend/                    ← React + Vite + Tailwind CSS
│   ├── public/
│   ├── src/
│   │   ├── store/               ← páginas y componentes de la tienda pública
│   │   ├── admin/               ← páginas y componentes del panel admin
│   │   └── shared/              ← componentes, hooks y utilidades comunes
│   │       ├── components/
│   │       ├── hooks/
│   │       └── utils/
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── Dockerfile
│   └── .env.example
│
├── api/                         ← ASP.NET Core Web API (.NET 8)
│   ├── Controllers/
│   ├── Services/
│   │   ├── Payments/            ← IPaymentGateway (Transbank / MercadoPago)
│   │   └── Storage/             ← IStorageService (Cloudinary / Local)
│   ├── Models/
│   ├── Data/                    ← EF Core DbContext y migraciones
│   ├── Middleware/
│   ├── TiendaApi.csproj
│   ├── Program.cs
│   ├── Dockerfile
│   └── appsettings.example.json
│
├── nginx/
│   └── nginx.conf.template      ← plantilla Nginx para el host
│
├── scripts/
│   └── new-client.sh            ← script para crear una nueva instancia cliente
│
├── docker-compose.yml           ← plantilla base de servicios
├── .env.example                 ← variables de entorno documentadas
├── .gitignore
└── README.md
```

---

## Variables de Entorno

Copia `.env.example` a `.env` y ajusta los valores:

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `STORE_NAME` | Nombre de la tienda | `Mi Tienda` |
| `FRONTEND_PORT` | Puerto expuesto del frontend | `3000` |
| `API_PORT` | Puerto expuesto de la API | `5000` |
| `DB_PORT` | Puerto expuesto de SQL Server | `1433` |
| `DB_NAME` | Nombre de la base de datos | `TiendaDB` |
| `SA_PASSWORD` | Contraseña SA de SQL Server | `YourStrong@Passw0rd` |
| `JWT_SECRET` | Clave secreta para firmar JWT | `mi_secreto_seguro` |
| `JWT_EXPIRY_MINUTES` | Expiración del token (minutos) | `60` |
| `PAYMENT_GATEWAY` | Pasarela activa: `transbank` o `mercadopago` | `transbank` |
| `STORAGE_PROVIDER` | Storage activo: `cloudinary` o `local` | `cloudinary` |
| `CLOUDINARY_URL` | URL de Cloudinary | `cloudinary://key:secret@cloud` |
| `LOCAL_STORAGE_PATH` | Ruta local de archivos (si storage=local) | `/app/uploads` |

---

## Desarrollo Local

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
# → http://localhost:5173
```

### API

```bash
cd api
cp appsettings.example.json appsettings.Development.json
# Edita la cadena de conexión en appsettings.Development.json
dotnet run
# → http://localhost:5000
# → Swagger UI: http://localhost:5000/swagger
```

### Base de datos (solo SQL Server en Docker)

```bash
cp .env.example .env
docker compose up db -d
```

---

## Crear un Nuevo Cliente

El script `scripts/new-client.sh` automatiza la creación de una instancia por cliente:

```bash
chmod +x scripts/new-client.sh   # ya incluido en el repo
./scripts/new-client.sh
```

El script solicita de forma interactiva:
- Nombre del cliente y dominio
- Puertos (frontend, API, DB)
- Contraseña SA, JWT secret
- Gateway de pago y provider de storage

Y genera automáticamente:
- `clientes/<nombre>/.env` con todos los valores
- `clientes/<nombre>/docker-compose.yml`
- `clientes/<nombre>/nginx.conf` (desde la plantilla con `envsubst`)

### Levantar el stack del cliente

```bash
cd clientes/<nombre>
docker compose -p <nombre> up -d
```

### Obtener certificado SSL

```bash
# Instalar el nginx.conf generado
sudo cp clientes/<nombre>/nginx.conf /etc/nginx/sites-available/<dominio>
sudo ln -s /etc/nginx/sites-available/<dominio> /etc/nginx/sites-enabled/<dominio>
sudo nginx -t && sudo systemctl reload nginx

# Obtener certificado con Certbot
certbot --nginx -d <dominio>
```

---

## Arquitectura Multi-Cliente

Cada cliente corre como un stack Docker independiente con puertos distintos:

```
VPS Host
  │
  ├── Nginx (host) ──── cliente1.com ──▶ localhost:3001 (React)
  │                                  ──▶ localhost:5001 (API)
  │
  ├── Nginx (host) ──── cliente2.com ──▶ localhost:3002 (React)
  │                                  ──▶ localhost:5002 (API)
  │
  ├── Stack cliente1 (docker compose -p cliente1)
  │     ├── frontend  :3001
  │     ├── api       :5001
  │     └── db        :1434
  │
  └── Stack cliente2 (docker compose -p cliente2)
        ├── frontend  :3002
        ├── api       :5002
        └── db        :1435
```

> ⚠️ Con 4 CPUs / 8 GB RAM se soportan cómodamente 3-4 clientes simultáneos.

---

## Fase 2 — Modelo de BD y Auth JWT

### Ejecutar la migración

```bash
cd api
cp appsettings.example.json appsettings.Development.json
# Asegúrate de tener SQL Server disponible y editar la cadena de conexión
dotnet ef database update
```

### Endpoints de autenticación

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Registro de nuevo usuario |
| `POST` | `/api/auth/login` | Login y obtención de tokens |
| `POST` | `/api/auth/refresh` | Renovar access token con refresh token |
| `POST` | `/api/auth/revoke` | Revocar refresh token (requiere autenticación) |

#### Ejemplo de registro
```json
POST /api/auth/register
{
  "nombre": "Juan Pérez",
  "email": "juan@ejemplo.com",
  "password": "MiPassword123!"
}
```

#### Ejemplo de login
```json
POST /api/auth/login
{
  "email": "juan@ejemplo.com",
  "password": "MiPassword123!"
}
```

#### Ejemplo de refresh
```json
POST /api/auth/refresh
{
  "accessToken": "<jwt_expirado>",
  "refreshToken": "<refresh_token>"
}
```

### Roles disponibles

| Rol | Descripción |
|-----|-------------|
| `CLIENTE` | Rol por defecto al registrarse |
| `ADMIN` | Acceso al panel de administración |

Para proteger endpoints con rol admin usa el atributo:
```csharp
[Authorize(Policy = "RequireAdmin")]
```

### Usar Bearer token en Swagger

1. Obtén el `accessToken` con `/api/auth/login`
2. Abre Swagger UI → Haz clic en **Authorize** (candado 🔒)
3. Ingresa: `Bearer <tu_token>`
4. Confirma con **Authorize**

---

## Fases de Desarrollo

| Fase | Descripción | Estado |
|------|-------------|--------|
| **Fase 1** | Base, estructura, Docker Compose | ✅ Completada |
| **Fase 2** | Modelo de BD, EF Core, Auth JWT + roles | ✅ Completada |
| **Fase 3** | Tienda pública, carrito, checkout UI | ⏳ Pendiente |
| **Fase 4** | Pasarela de pagos (Transbank + MercadoPago) | ⏳ Pendiente |
| **Fase 5** | Deploy, replicabilidad, script new-client.sh | ✅ Incluido en Fase 1 |

---

## Notas SSL con Certbot

- Certbot corre en el **host**, no en Docker
- El `nginx.conf` generado por `new-client.sh` ya incluye los bloques HTTP (redirect) y HTTPS (SSL)
- Certbot modifica automáticamente el archivo al ejecutar `certbot --nginx -d <dominio>`
- Los certificados se renuevan automáticamente con `certbot renew` (configurar en cron o systemd timer)

```bash
# Verificar renovación automática
certbot renew --dry-run
```