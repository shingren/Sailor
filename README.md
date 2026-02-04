# Sailor – Sistema de Gestión para Restaurantes y Bares

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Java](https://img.shields.io/badge/Java-21-orange.svg)](https://adoptium.net/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.0-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)

Sistema integral de gestión diseñado específicamente para restaurantes, bares y establecimientos gastronómicos. Sailor proporciona control completo sobre operaciones diarias incluyendo punto de venta (POS), gestión de mesas, cocina, inventario, facturación, cierre de caja, reservas y reportes analíticos.

## Características Principales

- **Gestión de Mesas (Floor Plan)**: Visualización y administración de mesas con estados en tiempo real (disponible, ocupada, reservada)
- **Punto de Venta (POS)**: Sistema completo de pedidos con catálogo de productos, cantidades y observaciones
- **Cocina**: Vista especializada para el personal de cocina con estados de pedidos (Pendiente, Preparación, Listo, Entregado)
- **Inventario**: Control de insumos con stock actual, stock mínimo, movimientos (COMPRA, AJUSTE, CONSUMO) y recetas de productos
- **Facturación**: Generación de facturas a partir de pedidos con soporte para pagos múltiples (Efectivo, Tarjeta)
- **Cierre de Caja**: Resumen diario de ventas, comparación entre saldo esperado y real, historial de cierres
- **Reservas**: Gestión de reservas de mesas por horario con validación de disponibilidad
- **Reportes**: Análisis de ventas del día, ventas por producto, pedidos por estado, consumo de insumos y reservas
- **Gestión de Personal (RBAC)**: Control de acceso basado en roles (ADMIN, MESERO, COCINA, CAJA, INVENTARIO, GERENCIA)
- **Autenticación Segura**: Sistema JWT con tokens de acceso (15 min) y refresh tokens (7 días)

## Arquitectura General

### Backend
- **Lenguaje**: Java 21
- **Framework**: Spring Boot 3.3.0
- **Base de Datos**: MySQL 8
- **ORM**: Hibernate JPA
- **Seguridad**: Spring Security + JWT (JJWT 0.12.3)
- **Construcción**: Maven

### Frontend
- **Framework**: React 18
- **Bundler**: Vite
- **Routing**: React Router DOM
- **State Management**: Context API (AuthContext)
- **Estilos**: CSS personalizado

### Infraestructura
- **Orquestación**: Docker + Docker Compose
- **Reverse Proxy**: Nginx con soporte HTTPS
- **Certificados**: SSL/TLS autofirmados (desarrollo)
- **Hot Reload**: Vite HMR con WebSocket habilitado

### Arquitectura de Contenedores
```
┌─────────────────────────────────────────┐
│         Nginx (Reverse Proxy)           │
│   HTTP (80) → HTTPS (443)               │
│   /api/* → backend:8080                 │
│   /* → frontend:5173                    │
└─────────────────────────────────────────┘
          ↓                    ↓
┌──────────────────┐   ┌──────────────────┐
│  Backend (API)   │   │ Frontend (Web)   │
│  Spring Boot     │   │  React + Vite    │
│  Port: 8080      │   │  Port: 5173      │
└──────────────────┘   └──────────────────┘
          ↓
┌──────────────────┐
│   MySQL DB       │
│   Port: 3306     │
│   (3307 host)    │
└──────────────────┘
```

## Requisitos Previos

### Para ejecución con Docker (Recomendado)
- [Docker](https://www.docker.com/get-started) 20.10+
- [Docker Compose](https://docs.docker.com/compose/install/) 2.0+

### Para ejecución sin Docker
- [Java JDK 21](https://adoptium.net/)
- [Maven 3.8+](https://maven.apache.org/download.cgi)
- [Node.js 18+](https://nodejs.org/) (con npm)
- [MySQL 8.0+](https://dev.mysql.com/downloads/mysql/)

## Instalación y Ejecución

### Opción 1: Docker Compose (Recomendada)

Esta es la forma más rápida y sencilla de ejecutar todo el stack completo.

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/AArCh95/Sailor.git
   cd Sailor
   ```

2. **Levantar todos los servicios**
   ```bash
   docker compose up -d --build
   ```

3. **Acceder a la aplicación**
   - HTTPS (producción): https://localhost
   - HTTP: http://localhost (redirige automáticamente a HTTPS)
   - API directa: http://localhost:8080
   - Frontend directo: http://localhost:5173

4. **Puertos utilizados**
   - `80`: HTTP (redirige a HTTPS)
   - `443`: HTTPS (Nginx)
   - `8080`: Backend API (Spring Boot)
   - `5173`: Frontend Dev Server (Vite)
   - `3307`: MySQL (puerto expuesto en host)

5. **Usuarios por defecto**
   - Admin: `admin@sailor.com` / `admin123`
   - Usuario: `user@sailor.com` / `user123`

6. **Detener los servicios**
   ```bash
   docker compose down
   ```

7. **Eliminar volúmenes (resetear base de datos)**
   ```bash
   docker compose down -v
   ```

### Opción 2: Backend sin Docker

1. **Configurar MySQL local**
   - Crear base de datos: `sailor`
   - Usuario: `sailor` / Contraseña: `sailor123`
   - Puerto: `3307` (o `3306` según tu instalación)

2. **Actualizar configuración** (si es necesario)

   Editar `backend/src/main/resources/application.yml`:
   ```yaml
   spring:
     datasource:
       url: jdbc:mysql://localhost:3307/sailor
   ```

3. **Compilar y ejecutar**
   ```bash
   cd backend
   mvn clean package
   mvn spring-boot:run
   ```

   O ejecutar directamente:
   ```bash
   mvn clean package
   java -jar target/sailor-0.0.1-SNAPSHOT.jar
   ```

4. **Acceder a la API**
   - http://localhost:8080

### Opción 3: Frontend sin Docker

1. **Instalar dependencias**
   ```bash
   cd frontend
   npm install
   ```

2. **Configurar proxy (si es necesario)**

   Verificar `frontend/vite.config.js`:
   ```javascript
   server: {
     proxy: {
       '/api': {
         target: 'http://localhost:8080',
         changeOrigin: true
       }
     }
   }
   ```

3. **Ejecutar servidor de desarrollo**
   ```bash
   npm run dev
   ```

4. **Acceder a la aplicación**
   - http://localhost:5173

5. **Compilar para producción**
   ```bash
   npm run build
   ```

## Estructura del Proyecto

```
Sailor/
├── backend/                    # Backend Spring Boot
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/sailor/
│   │   │   │   ├── config/        # Configuración (Security, CORS, DataInitializer)
│   │   │   │   ├── controller/    # REST Controllers
│   │   │   │   ├── dto/           # Data Transfer Objects
│   │   │   │   ├── entity/        # Entidades JPA
│   │   │   │   ├── repository/    # Repositorios Spring Data
│   │   │   │   ├── service/       # Lógica de negocio
│   │   │   │   └── SailorApplication.java
│   │   │   └── resources/
│   │   │       └── application.yml
│   │   └── test/
│   ├── Dockerfile
│   └── pom.xml
│
├── frontend/                   # Frontend React + Vite
│   ├── src/
│   │   ├── App.jsx            # Componente principal y router
│   │   ├── AuthContext.jsx   # Context de autenticación
│   │   ├── HomePage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── MesasPage.jsx
│   │   ├── ProductosPage.jsx
│   │   ├── PedidosPage.jsx
│   │   ├── CocinaPage.jsx
│   │   ├── FacturasPage.jsx
│   │   ├── InventarioPage.jsx
│   │   ├── ReservasPage.jsx
│   │   ├── ReportesPage.jsx
│   │   ├── StaffPage.jsx
│   │   ├── CierreCajaPage.jsx
│   │   └── index.css
│   ├── Dockerfile
│   ├── vite.config.js
│   └── package.json
│
├── nginx/                      # Configuración Nginx
│   ├── nginx.conf
│   └── certs/                 # Certificados SSL autofirmados
│
├── docker-compose.yml         # Orquestación de contenedores
├── .gitignore
├── README.md
├── CLAUDE.md                  # Instrucciones para Claude Code
├── CONTRIBUTING.md            # Guía para colaboradores
└── SETUP.md                   # Guía de configuración detallada
```

## API Endpoints

### Públicos (sin autenticación)
- `GET /health` - Health check
- `POST /auth/login` - Iniciar sesión
- `POST /auth/refresh` - Refrescar access token

### Protegidos (requieren Bearer token)
- **Mesas**: `GET /mesas`, `POST /mesas`
- **Productos**: `GET /productos`, `POST /productos`
- **Pedidos**: `GET /pedidos`, `POST /pedidos`, `GET /pedidos/{id}`
- **Facturas**: `GET /facturas`, `POST /facturas`
- **Pagos**: `POST /pagos`
- **Insumos**: `GET /insumos`, `POST /insumos`, `PUT /insumos/{id}`
- **Movimientos**: `GET /insumos/movimientos`, `POST /insumos/movimientos`
- **Recetas**: `GET /recetas`, `POST /recetas`
- **Reservas**: `GET /reservas`, `POST /reservas`, `POST /reservas/{id}/cancelar`
- **Reportes**: `GET /reportes/*`
- **Usuarios** (solo ADMIN): `GET /usuarios`, `POST /usuarios`, `PUT /usuarios/{id}/rol`, `DELETE /usuarios/{id}`
- **Cierre de Caja**: `GET /cierre-caja`, `POST /cierre-caja`, `GET /cierre-caja/resumen-dia`

## Guía para Colaboradores

Este proyecto utiliza un flujo de trabajo basado en Git con ramas de características y Pull Requests.

### Flujo de trabajo básico

1. **Clonar el repositorio** (si aún no lo has hecho)
   ```bash
   git clone https://github.com/AArCh95/Sailor.git
   cd Sailor
   ```

2. **Actualizar tu copia local**
   ```bash
   git checkout main
   git pull origin main
   ```

3. **Crear una nueva rama**
   ```bash
   git checkout -b feature/nombre-de-tu-feature
   ```

   Convenciones de nombres de ramas:
   - `feature/` - Nueva funcionalidad
   - `fix/` - Corrección de bugs
   - `ui/` - Mejoras de interfaz
   - `refactor/` - Refactorización de código
   - `docs/` - Documentación

4. **Hacer tus cambios y commits**
   ```bash
   git add .
   git commit -m "Descripción clara de los cambios"
   ```

5. **Pushear tu rama**
   ```bash
   git push origin feature/nombre-de-tu-feature
   ```

6. **Abrir un Pull Request** en GitHub hacia la rama `main`

### Estándares de commits

- Usa mensajes descriptivos en español
- Sé específico sobre qué cambió y por qué
- Ejemplos:
  - ✅ "Agregar validación de stock en creación de pedidos"
  - ✅ "Corregir cálculo de diferencia en cierre de caja"
  - ❌ "Fix bug"
  - ❌ "Update"

### Antes de hacer un Pull Request

1. Asegúrate de que el código compile sin errores
   ```bash
   # Backend
   cd backend && mvn clean package

   # Frontend
   cd frontend && npm run build
   ```

2. Prueba tus cambios con Docker Compose
   ```bash
   docker compose up --build
   ```

3. Verifica que no hayas incluido archivos sensibles (`.env`, credenciales, etc.)

Para más detalles, consulta [CONTRIBUTING.md](./CONTRIBUTING.md).

## Notas de Seguridad

### Variables de Entorno
- **NUNCA** subas archivos `.env` al repositorio
- **NUNCA** incluyas credenciales, API keys o secretos en el código
- Usa variables de entorno para configuración sensible

### Certificados SSL
- Los certificados en `nginx/certs/` son **autofirmados** y solo para desarrollo
- En producción, usa certificados válidos (Let's Encrypt, etc.)

### Secrets JWT
- La clave secreta JWT está en `application.yml` para desarrollo
- En producción, usa variables de entorno o servicios de secretos

### Base de Datos
- Las credenciales por defecto son solo para desarrollo local
- En producción, usa contraseñas fuertes y rotar periódicamente

## Licencia

Este proyecto está licenciado bajo la **MIT License** - consulta el archivo [LICENSE](./LICENSE) para más detalles.

## Seguridad

Para reportar vulnerabilidades de seguridad, consulta nuestra [Política de Seguridad](./SECURITY.md).

**⚠️ Importante para Producción:**
- Cambia todas las credenciales por defecto (base de datos, usuarios, JWT secret)
- Usa certificados SSL/TLS válidos (no los autofirmados incluidos)
- Configura variables de entorno para secretos (ver `.env.example`)
- Revisa la [Política de Seguridad](./SECURITY.md) para mejores prácticas

## Disclaimer

Este software se proporciona "tal cual", sin garantía de ningún tipo. Consulta la [LICENCIA MIT](./LICENSE) para más información.

## Contribuciones

¡Las contribuciones son bienvenidas! Por favor, consulta [CONTRIBUTING.md](./CONTRIBUTING.md) para conocer el proceso.

---

**Desarrollado con ❤️ para la industria gastronómica**
