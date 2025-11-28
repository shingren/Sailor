# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sailor is a restaurant management system built with a Spring Boot backend and React frontend, running on Docker with Nginx reverse proxy. The application manages tables (mesas), products (productos), and orders (pedidos) with JWT authentication.

## Architecture

### Backend (Spring Boot 3.3.0 + Java 21)
- **Package structure**: `com.sailor.*`
  - `entity`: JPA entities (Mesa, Producto, Pedido, PedidoItem, Usuario)
  - `repository`: Spring Data JPA repositories
  - `service`: Business logic (PedidoService, CustomUserDetailsService)
  - `controller`: REST controllers (MesaController, ProductoController, PedidoController, HealthController)
  - `dto`: Data transfer objects for request/response mapping
  - `config`: Security, CORS, and data initialization
- **Database**: MySQL 8 with Hibernate (ddl-auto: update)
- **Authentication**: JWT (JSON Web Tokens) with JJWT 0.12.3
  - Access tokens: 15 minutes validity
  - Refresh tokens: 7 days validity
  - HS256 signing algorithm
- **Security**: All endpoints require authentication except `/auth/**` and `/health`

### Frontend (React 18 + Vite)
- **Routing**: react-router-dom for navigation
- **Authentication**: Context-based with JWT tokens stored in memory
  - AuthContext provides: `email`, `isAuthenticated`, `login()`, `logout()`, `getAuthHeader()`
  - Access and refresh tokens stored in state (not persisted)
- **Pages**: HomePage, LoginPage, MesasPage, ProductosPage, PedidosPage, FacturasPage, InventarioPage, ReservasPage, CocinaPage, ReportesPage
- **API calls**: Use relative `/api/...` paths with `getAuthHeader()` for Bearer token authorization

### Reverse Proxy (Nginx + HTTPS)
- **HTTP → HTTPS redirect**: All port 80 traffic redirected to port 443
- **SSL/TLS**: Self-signed certificates in `nginx/certs/`
- **Proxy rules**:
  - `/api/*` → Spring Boot backend (http://api:8080/)
  - `/*` → React frontend (http://web:5173/)
- **WebSocket support**: Enabled for Vite HMR

### Domain Model Relationships
- **Mesa**: Standalone table entity
- **Producto**: Standalone product catalog
- **Pedido**: One-to-Many with PedidoItem, Many-to-One with Mesa
- **PedidoItem**: Many-to-One with both Pedido and Producto
- Order creation is transactional and automatically sets `precioUnitario` from current product price

## Development Commands

### Full Stack (Docker)
```bash
# Start all services (MySQL, API, Web, Nginx)
docker compose up

# Rebuild and start
docker compose up --build

# Stop all services
docker compose down

# Remove volumes (reset database)
docker compose down -v
```

**Access points:**
- HTTPS (production-like): https://localhost
- HTTP: http://localhost (redirects to HTTPS)
- Direct backend access: http://localhost:8080 (bypass nginx)
- Direct frontend access: http://localhost:5173 (bypass nginx)

### Backend Only
```bash
cd backend

# Build with Maven
mvn clean package

# Run locally (requires MySQL running)
mvn spring-boot:run

# Skip tests during build
mvn clean package -DskipTests
```

### Frontend Only
```bash
cd frontend

# Install dependencies
npm install

# Run dev server (http://localhost:5173)
npm run dev

# Build for production
npm run build
```

## Database Configuration

**Docker environment** (default):
- Host: `db` (service name)
- Port: 3306 (internal), 3307 (host)
- Database: `sailor`
- User: `sailor`
- Password: `sailor123`

**Local development**: Update `backend/src/main/resources/application.yml` to point to `localhost:3307`

## Authentication

Default users are created by `DataInitializer`:
- Admin: admin@sailor.com / admin123
- User: user@sailor.com / user123

To add new users, modify [backend/src/main/java/com/sailor/config/DataInitializer.java](backend/src/main/java/com/sailor/config/DataInitializer.java)

## API Endpoints

All endpoints require JWT Bearer token authentication except `/auth/**` and `/health`

**Public endpoints:**
- `GET /health` - Health check
- `POST /auth/login` - Login (returns accessToken and refreshToken)
- `POST /auth/refresh` - Refresh access token

**Protected endpoints (require Bearer token):**
- `GET /mesas` - List all tables
- `POST /mesas` - Create table
- `GET /productos` - List all products
- `POST /productos` - Create product
- `GET /pedidos` - List all orders
- `GET /pedidos/{id}` - Get order by ID
- `POST /pedidos` - Create order (requires `mesaId`, `items[]`, optional `observaciones`)
- `GET /facturas` - List all invoices
- `POST /facturas` - Create invoice
- `POST /pagos` - Register payment
- `GET /insumos` - List ingredients
- `POST /insumos` - Create ingredient
- `GET /recetas` - List recipes
- `POST /recetas` - Create recipe
- `GET /reservas` - List reservations
- `POST /reservas` - Create reservation
- `GET /reportes/*` - Various reports

## Making Changes

### Adding a new entity
1. Create entity in `backend/src/main/java/com/sailor/entity/`
2. Create repository in `backend/src/main/java/com/sailor/repository/`
3. Create service if business logic needed
4. Create controller for REST endpoints
5. Add security rules in `SecurityConfig.java` if needed

### Adding a new frontend page
1. Create page component in `frontend/src/`
2. Add route in `App.jsx`
3. Add navigation link in `App.jsx` nav bar
4. Use `useAuth()` hook for authenticated API calls

### Modifying security
Edit [backend/src/main/java/com/sailor/config/SecurityConfig.java](backend/src/main/java/com/sailor/config/SecurityConfig.java):
- CSRF is disabled for API use
- All endpoints authenticated by default
- Use `.requestMatchers("/path/**").permitAll()` to make endpoints public
