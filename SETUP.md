# Guía de Configuración - Sailor

Esta guía proporciona instrucciones detalladas para configurar el entorno de desarrollo de Sailor, tanto con Docker como sin él.

## Tabla de Contenidos

- [Prerequisitos](#prerequisitos)
- [Configuración Rápida con Docker](#configuración-rápida-con-docker)
- [Configuración Manual (Sin Docker)](#configuración-manual-sin-docker)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Variables de Entorno](#variables-de-entorno)
- [Base de Datos](#base-de-datos)
- [Usuarios Iniciales](#usuarios-iniciales)
- [Nginx y Reverse Proxy](#nginx-y-reverse-proxy)
- [Solución de Problemas](#solución-de-problemas)

---

## Prerequisitos

### Para Desarrollo con Docker

- **Docker**: Versión 20.10 o superior
  - [Instalación en Windows](https://docs.docker.com/desktop/install/windows-install/)
  - [Instalación en macOS](https://docs.docker.com/desktop/install/mac-install/)
  - [Instalación en Linux](https://docs.docker.com/engine/install/)

- **Docker Compose**: Versión 2.0 o superior (incluido con Docker Desktop)

- **Git**: Para clonar el repositorio

### Para Desarrollo sin Docker

- **Java JDK 21**: [Adoptium/Eclipse Temurin](https://adoptium.net/)
- **Maven**: Versión 3.8+ ([Descarga](https://maven.apache.org/download.cgi))
- **Node.js**: Versión 18+ con npm ([Descarga](https://nodejs.org/))
- **MySQL**: Versión 8.0+ ([Descarga](https://dev.mysql.com/downloads/mysql/))
- **Git**: Para clonar el repositorio

---

## Configuración Rápida con Docker

Esta es la forma más rápida de levantar todo el stack completo.

### 1. Clonar el Repositorio

```bash
git clone <repository-url>
cd Sailor
```

### 2. Levantar Todos los Servicios

```bash
docker compose up -d --build
```

Este comando:
- Construye las imágenes de backend y frontend
- Descarga la imagen de MySQL 8
- Descarga la imagen de Nginx
- Crea la red interna de Docker
- Levanta todos los contenedores en modo daemon (`-d`)

### 3. Verificar Estado de los Contenedores

```bash
docker compose ps
```

Deberías ver 4 contenedores ejecutándose:
- `sailor-nginx-1` - Reverse proxy (puertos 80, 443)
- `sailor-api-1` - Backend Spring Boot (puerto 8080)
- `sailor-web-1` - Frontend React/Vite (puerto 5173)
- `sailor-db-1` - MySQL 8 (puerto 3307)

### 4. Ver Logs

```bash
# Todos los servicios
docker compose logs

# Solo backend
docker compose logs api

# Solo frontend
docker compose logs web

# Seguir logs en tiempo real
docker compose logs -f api
```

### 5. Acceder a la Aplicación

- **HTTPS (Recomendado)**: https://localhost
- **HTTP**: http://localhost (redirige a HTTPS)
- **API directa**: http://localhost:8080
- **Frontend directo**: http://localhost:5173

**Nota sobre HTTPS**: Los certificados SSL son autofirmados, por lo que tu navegador mostrará una advertencia. Es seguro continuar en desarrollo local.

### 6. Iniciar Sesión

Usuarios creados automáticamente:
- **Admin**: `admin@sailor.com` / `admin123`
- **Usuario**: `user@sailor.com` / `user123`

### 7. Detener los Servicios

```bash
# Detener contenedores (conserva datos)
docker compose down

# Detener y eliminar volúmenes (borra base de datos)
docker compose down -v
```

### 8. Reconstruir después de Cambios

```bash
# Backend
docker compose up -d --build api

# Frontend
docker compose up -d --build web

# Todo
docker compose up -d --build
```

---

## Configuración Manual (Sin Docker)

### Backend (Spring Boot)

#### 1. Instalar Dependencias

Asegúrate de tener instalado:
- Java JDK 21
- Maven 3.8+

Verifica las instalaciones:
```bash
java -version  # Debería mostrar versión 21.x
mvn -version   # Debería mostrar versión 3.8+
```

#### 2. Configurar MySQL

Crea la base de datos y el usuario:

```sql
CREATE DATABASE sailor CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'sailor'@'localhost' IDENTIFIED BY 'sailor123';
GRANT ALL PRIVILEGES ON sailor.* TO 'sailor'@'localhost';
FLUSH PRIVILEGES;
```

#### 3. Configurar application.yml

Edita `backend/src/main/resources/application.yml`:

```yaml
spring:
  application:
    name: sailor
  datasource:
    url: jdbc:mysql://localhost:3306/sailor  # Cambia el puerto si es diferente
    username: sailor
    password: sailor123
    driver-class-name: com.mysql.cj.jdbc.Driver
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: false
    properties:
      hibernate:
        dialect: org.hibernate.dialect.MySQL8Dialect

server:
  port: 8080

jwt:
  secret: your-secret-key-min-256-bits-for-hs256-algorithm-change-in-production
  access-token-validity: 900000     # 15 minutos
  refresh-token-validity: 604800000 # 7 días
```

**Importante**: Cambia `jwt.secret` a un valor único en producción.

#### 4. Compilar el Backend

```bash
cd backend
mvn clean package
```

Esto genera el archivo JAR en `target/sailor-0.0.1-SNAPSHOT.jar`.

#### 5. Ejecutar el Backend

Opción A - Con Maven:
```bash
mvn spring-boot:run
```

Opción B - Con JAR:
```bash
java -jar target/sailor-0.0.1-SNAPSHOT.jar
```

#### 6. Verificar que Funciona

```bash
curl http://localhost:8080/health
```

Respuesta esperada: `OK`

### Frontend (React + Vite)

#### 1. Instalar Dependencias

Asegúrate de tener instalado:
- Node.js 18+
- npm (incluido con Node.js)

Verifica las instalaciones:
```bash
node -v  # Debería mostrar versión 18+
npm -v   # Debería mostrar versión 8+
```

#### 2. Instalar Paquetes

```bash
cd frontend
npm install
```

#### 3. Configurar Proxy (Opcional)

Verifica que `frontend/vite.config.js` tenga la configuración correcta:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  }
})
```

Esto hace que todas las llamadas a `/api/*` se redirijan al backend en `localhost:8080`.

#### 4. Ejecutar el Frontend

```bash
npm run dev
```

#### 5. Acceder a la Aplicación

Abre tu navegador en: http://localhost:5173

#### 6. Compilar para Producción

```bash
npm run build
```

Los archivos compilados estarán en `frontend/dist/`.

---

## Estructura del Proyecto

### Backend (`backend/`)

```
backend/
├── src/
│   ├── main/
│   │   ├── java/com/sailor/
│   │   │   ├── config/
│   │   │   │   ├── SecurityConfig.java        # Configuración de Spring Security
│   │   │   │   ├── CorsConfig.java            # Configuración de CORS
│   │   │   │   ├── JwtUtil.java               # Utilidad para JWT
│   │   │   │   └── DataInitializer.java       # Crea usuarios iniciales
│   │   │   │
│   │   │   ├── controller/
│   │   │   │   ├── AuthController.java        # Login y refresh token
│   │   │   │   ├── MesaController.java
│   │   │   │   ├── ProductoController.java
│   │   │   │   ├── PedidoController.java
│   │   │   │   ├── FacturaController.java
│   │   │   │   ├── InsumoController.java
│   │   │   │   ├── ReservaController.java
│   │   │   │   ├── ReportesController.java
│   │   │   │   ├── UsuarioController.java
│   │   │   │   ├── CierreCajaController.java
│   │   │   │   └── HealthController.java
│   │   │   │
│   │   │   ├── dto/                           # Data Transfer Objects
│   │   │   │   ├── *CreateRequestDTO.java
│   │   │   │   ├── *ResponseDTO.java
│   │   │   │   └── *UpdateRequestDTO.java
│   │   │   │
│   │   │   ├── entity/                        # Entidades JPA
│   │   │   │   ├── Mesa.java
│   │   │   │   ├── Producto.java
│   │   │   │   ├── Pedido.java
│   │   │   │   ├── PedidoItem.java
│   │   │   │   ├── Factura.java
│   │   │   │   ├── Pago.java
│   │   │   │   ├── Insumo.java
│   │   │   │   ├── MovimientoInsumo.java
│   │   │   │   ├── Receta.java
│   │   │   │   ├── RecetaItem.java
│   │   │   │   ├── Reserva.java
│   │   │   │   ├── Usuario.java
│   │   │   │   └── CierreCaja.java
│   │   │   │
│   │   │   ├── repository/                    # Spring Data JPA
│   │   │   │   └── *Repository.java
│   │   │   │
│   │   │   ├── service/                       # Lógica de negocio
│   │   │   │   ├── PedidoService.java
│   │   │   │   ├── InsumoService.java
│   │   │   │   ├── CustomUserDetailsService.java
│   │   │   │   └── ...
│   │   │   │
│   │   │   └── SailorApplication.java         # Punto de entrada
│   │   │
│   │   └── resources/
│   │       └── application.yml                # Configuración
│   │
│   └── test/                                  # Tests unitarios
│
├── Dockerfile                                 # Imagen Docker del backend
└── pom.xml                                    # Dependencias Maven
```

### Frontend (`frontend/`)

```
frontend/
├── src/
│   ├── App.jsx                    # Router principal y navegación
│   ├── AuthContext.jsx            # Context de autenticación (JWT)
│   ├── HomePage.jsx               # Página de inicio
│   ├── LoginPage.jsx              # Página de login
│   ├── MesasPage.jsx              # Gestión de mesas
│   ├── ProductosPage.jsx          # Gestión de productos
│   ├── PedidosPage.jsx            # Gestión de pedidos
│   ├── CocinaPage.jsx             # Vista de cocina
│   ├── FacturasPage.jsx           # Facturación y pagos
│   ├── InventarioPage.jsx         # Gestión de inventario
│   ├── ReservasPage.jsx           # Gestión de reservas
│   ├── ReportesPage.jsx           # Reportes y análisis
│   ├── StaffPage.jsx              # Gestión de personal (RBAC)
│   ├── CierreCajaPage.jsx         # Cierre de caja diario
│   ├── main.jsx                   # Punto de entrada
│   └── index.css                  # Estilos globales
│
├── index.html
├── vite.config.js                 # Configuración de Vite
├── package.json                   # Dependencias npm
└── Dockerfile                     # Imagen Docker del frontend
```

### Docker (`/`)

```
Sailor/
├── docker-compose.yml             # Orquestación de contenedores
└── nginx/
    ├── nginx.conf                 # Configuración de Nginx
    └── certs/
        ├── localhost.crt          # Certificado SSL (autofirmado)
        └── localhost.key          # Clave privada SSL
```

---

## Variables de Entorno

### Backend

Configuradas en `backend/src/main/resources/application.yml`:

| Variable | Valor por defecto | Descripción |
|----------|-------------------|-------------|
| `spring.datasource.url` | `jdbc:mysql://db:3306/sailor` | URL de conexión a MySQL |
| `spring.datasource.username` | `sailor` | Usuario de MySQL |
| `spring.datasource.password` | `sailor123` | Contraseña de MySQL |
| `server.port` | `8080` | Puerto del backend |
| `jwt.secret` | `your-secret-key...` | Secreto para firmar JWT |
| `jwt.access-token-validity` | `900000` | Validez del access token (15 min) |
| `jwt.refresh-token-validity` | `604800000` | Validez del refresh token (7 días) |

**Para Docker**: Las variables se configuran automáticamente en `docker-compose.yml`.

**Para desarrollo local**: Modifica `application.yml` directamente o usa variables de entorno:

```bash
export SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/sailor
export JWT_SECRET=your-custom-secret-key
mvn spring-boot:run
```

### Frontend

El frontend no requiere variables de entorno especiales. Todas las llamadas API usan rutas relativas (`/api/*`) que son manejadas por:
- Vite proxy en desarrollo (`vite.config.js`)
- Nginx en producción (`nginx.conf`)

---

## Base de Datos

### Esquema Automático

Sailor usa Hibernate con `ddl-auto: update`, lo que significa que:
- Las tablas se crean automáticamente al iniciar el backend
- No necesitas ejecutar scripts SQL manualmente
- El esquema se actualiza cuando cambias las entidades

### Tablas Principales

- `mesa` - Mesas del restaurante
- `producto` - Productos del menú
- `pedido` - Pedidos de clientes
- `pedido_item` - Items de cada pedido
- `factura` - Facturas generadas
- `pago` - Pagos realizados
- `insumo` - Insumos del inventario
- `movimiento_insumo` - Movimientos de inventario
- `receta` - Recetas de productos
- `receta_item` - Items de cada receta
- `reserva` - Reservas de mesas
- `usuario` - Usuarios del sistema
- `cierre_caja` - Cierres de caja diarios

### Conexión Directa a MySQL

**Con Docker**:
```bash
docker exec -it sailor-db-1 mysql -u sailor -p
# Contraseña: sailor123
```

**Sin Docker**:
```bash
mysql -u sailor -p sailor
# Contraseña: sailor123
```

### Backup de Base de Datos

```bash
# Exportar
docker exec sailor-db-1 mysqldump -u sailor -psailor123 sailor > backup.sql

# Importar
docker exec -i sailor-db-1 mysql -u sailor -psailor123 sailor < backup.sql
```

---

## Usuarios Iniciales

Los usuarios se crean automáticamente al iniciar el backend gracias a `DataInitializer.java`.

### Usuarios por Defecto

| Email | Contraseña | Rol | Descripción |
|-------|-----------|-----|-------------|
| `admin@sailor.com` | `admin123` | `ADMIN` | Acceso completo al sistema |
| `user@sailor.com` | `user123` | `MESERO` | Usuario básico |

### Crear Usuarios Adicionales

**Opción 1**: Desde la interfaz (requiere rol ADMIN)
1. Inicia sesión como admin
2. Ve a "Gestión de Personal"
3. Llena el formulario y selecciona el rol

**Opción 2**: Modificar `DataInitializer.java`

Edita `backend/src/main/java/com/sailor/config/DataInitializer.java`:

```java
@PostConstruct
public void init() {
    if (usuarioRepository.count() == 0) {
        // Usuario admin
        Usuario admin = new Usuario();
        admin.setEmail("admin@sailor.com");
        admin.setPassword(passwordEncoder.encode("admin123"));
        admin.setRol("ADMIN");
        usuarioRepository.save(admin);

        // Usuario adicional
        Usuario cocina = new Usuario();
        cocina.setEmail("cocina@sailor.com");
        cocina.setPassword(passwordEncoder.encode("cocina123"));
        cocina.setRol("COCINA");
        usuarioRepository.save(cocina);
    }
}
```

Reinicia el backend para que se apliquen los cambios.

### Roles Disponibles

- `ADMIN` - Acceso total (gestión de usuarios, reportes, configuración)
- `MESERO` - Gestión de pedidos y mesas
- `COCINA` - Vista de cocina
- `CAJA` - Facturación, pagos y cierre de caja
- `INVENTARIO` - Gestión de inventario
- `GERENCIA` - Reportes y análisis

---

## Nginx y Reverse Proxy

### Cómo Funciona

```
Cliente (Navegador)
        ↓
   Nginx (443/80)
        ↓
   ┌────┴─────┐
   ↓          ↓
/api/*      /*
Backend   Frontend
(8080)    (5173)
```

Nginx actúa como punto de entrada único:
- Recibe todas las peticiones en puerto 80 (HTTP) y 443 (HTTPS)
- Redirige HTTP → HTTPS
- Enruta `/api/*` → Backend (`http://api:8080/`)
- Enruta `/*` → Frontend (`http://web:5173/`)

### Configuración

Archivo: `nginx/nginx.conf`

```nginx
server {
    listen 443 ssl;
    server_name localhost;

    ssl_certificate /etc/nginx/certs/localhost.crt;
    ssl_certificate_key /etc/nginx/certs/localhost.key;

    # Proxy a backend
    location /api/ {
        proxy_pass http://api:8080/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Proxy a frontend
    location / {
        proxy_pass http://web:5173/;
        proxy_set_header Host $host;

        # WebSocket support para Vite HMR
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### Certificados SSL

Los certificados en `nginx/certs/` son autofirmados y **solo para desarrollo**.

**Generar nuevos certificados**:
```bash
cd nginx/certs
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout localhost.key \
  -out localhost.crt \
  -subj "/CN=localhost"
```

**Para producción**: Usa [Let's Encrypt](https://letsencrypt.org/) o certificados de tu proveedor.

---

## Solución de Problemas

### Backend no inicia

**Error**: `Communications link failure`

**Solución**: MySQL no está listo. Espera unos segundos y reinicia:
```bash
docker compose restart api
```

**Error**: `Access denied for user 'sailor'@'...'`

**Solución**: Credenciales incorrectas. Verifica `application.yml` y `docker-compose.yml`.

### Frontend no carga

**Error**: `Cannot GET /api/...`

**Solución**: Backend no está corriendo. Verifica:
```bash
docker compose logs api
curl http://localhost:8080/health
```

**Error**: Página en blanco

**Solución**: Revisa la consola del navegador (F12) para ver errores JavaScript.

### Problemas de CORS

**Error**: `Access to fetch blocked by CORS policy`

**Solución**: Verifica que `CorsConfig.java` permita tu origen:
```java
configuration.setAllowedOrigins(Arrays.asList(
    "http://localhost:5173",
    "https://localhost"
));
```

### Puerto ya en uso

**Error**: `Bind for 0.0.0.0:8080 failed: port is already allocated`

**Solución**: Otro proceso está usando el puerto. Encuentra y detén el proceso:

```bash
# Windows
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :8080
kill -9 <PID>
```

O cambia el puerto en `docker-compose.yml`.

### MySQL no guarda datos

**Problema**: Al hacer `docker compose down`, se pierden todos los datos.

**Solución**: No uses la flag `-v`:
```bash
docker compose down  # Conserva volúmenes
```

Para resetear la base de datos intencionalmente:
```bash
docker compose down -v  # Elimina volúmenes
```

### No puedo acceder a HTTPS

**Error**: `NET::ERR_CERT_AUTHORITY_INVALID`

**Solución**: Es normal con certificados autofirmados. Haz clic en "Avanzado" → "Continuar de todas formas" (Chrome) o equivalente en tu navegador.

### Cambios en backend no se reflejan

**Solución**: Reconstruye la imagen:
```bash
docker compose up -d --build api
```

### Cambios en frontend no se reflejan

**Solución**: Vite HMR debería detectar cambios automáticamente. Si no funciona:
```bash
docker compose restart web
```

---

## Próximos Pasos

Una vez que tengas el entorno configurado:

1. Lee [CONTRIBUTING.md](./CONTRIBUTING.md) para aprender el flujo de trabajo
2. Familiarízate con la arquitectura en [README.md](./README.md)
3. Explora el código en `backend/` y `frontend/`
4. Revisa los Issues abiertos en GitHub
5. ¡Empieza a contribuir!

---

**Última actualización**: Diciembre 2024
