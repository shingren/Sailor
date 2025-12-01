# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sailor is a restaurant management system built with a Spring Boot backend and React frontend, running on Docker with Nginx reverse proxy. The application manages tables (mesas), products (productos), orders (pedidos), invoices (facturas), payments (pagos), inventory (insumos), recipes (recetas), reservations (reservas), and cash register closures (cierre de caja) with JWT authentication and role-based access control (RBAC).

## Architecture

### Backend (Spring Boot 3.3.0 + Java 21)
- **Package structure**: `com.sailor.*`
  - `entity`: JPA entities (Mesa, Producto, Pedido, PedidoItem, PedidoEstado, Usuario, Factura, Pago, Insumo, Receta, RecetaItem, MovimientoInsumo, Reserva, CierreCaja)
  - `repository`: Spring Data JPA repositories
  - `service`: Business logic (PedidoService, FacturaService, InsumoService, RecetaService, ReservaService, CierreCajaService, UsuarioService, JwtUtil, CustomUserDetailsService)
  - `controller`: REST controllers (MesaController, ProductoController, PedidoController, FacturaController, PagoController, InsumoController, RecetaController, ReservaController, ReporteController, CierreCajaController, UsuarioController, AuthController, HealthController)
  - `dto`: Data transfer objects for request/response mapping
  - `config`: Security, CORS, JWT filter, data initialization, exception handling
- **Database**: MySQL 8 with Hibernate (ddl-auto: update)
- **Authentication**: JWT (JSON Web Tokens) with JJWT 0.12.3
  - Access tokens: 15 minutes validity
  - Refresh tokens: 7 days validity
  - HS256 signing algorithm
- **Authorization**: Role-Based Access Control (RBAC) with 6 roles:
  - `ADMIN`: Full system access
  - `MESERO`: Tables, orders, reservations
  - `COCINA`: View active orders, update order status
  - `CAJA`: Invoices, payments, cash register closure
  - `INVENTARIO`: Ingredients, recipes, inventory movements
  - `GERENCIA`: Reports and analytics
- **Security**: All endpoints require authentication except `/auth/**` and `/health`. Access is restricted by role (see SecurityConfig.java)

### Frontend (React 18 + Vite)
- **Routing**: react-router-dom for navigation
- **Authentication**: Context-based with JWT tokens stored in localStorage
  - AuthContext provides: `email`, `rol`, `isAuthenticated`, `login()`, `logout()`, `getAuthHeader()`, `hasRole()`
  - Access and refresh tokens persisted in localStorage
- **Pages**: HomePage, LoginPage, MesasPage, ProductosPage, PedidosPage, FacturasPage, InventarioPage, ReservasPage, CocinaPage, ReportesPage, StaffPage, CierreCajaPage
- **API calls**: Use relative `/api/...` paths with `getAuthHeader()` for Bearer token authorization
- **Role-based UI**: Use `hasRole(roleName)` to conditionally render UI elements based on user role

### Reverse Proxy (Nginx + HTTPS)
- **HTTP → HTTPS redirect**: All port 80 traffic redirected to port 443
- **SSL/TLS**: Self-signed certificates in `nginx/certs/`
- **Proxy rules**:
  - `/api/*` → Spring Boot backend (http://api:8080/)
  - `/*` → React frontend (http://web:5173/)
- **WebSocket support**: Enabled for Vite HMR

### Domain Model Relationships
- **Mesa**: Standalone table entity
- **Usuario**: User entity with `rol` field (ADMIN, MESERO, COCINA, CAJA, INVENTARIO, GERENCIA)
- **Producto**: Standalone product catalog
- **Pedido**: One-to-Many with PedidoItem, Many-to-One with Mesa
  - Has `estado` field (enum: PENDIENTE → PREPARACION → LISTO → ENTREGADO)
  - State transitions are validated (see PedidoEstado enum)
- **PedidoItem**: Many-to-One with both Pedido and Producto
  - Order creation is transactional and automatically sets `precioUnitario` from current product price
- **Factura** (Invoice): Many-to-One with Pedido, One-to-Many with Pago
- **Pago** (Payment): Many-to-One with Factura, has `metodoPago` field (EFECTIVO, TARJETA)
- **Insumo** (Ingredient): Standalone ingredient/supply entity with stock tracking
- **Receta** (Recipe): One-to-Many with RecetaItem, Many-to-One with Producto
- **RecetaItem**: Many-to-One with both Receta and Insumo
- **MovimientoInsumo** (Inventory Movement): Many-to-One with Insumo, tracks stock changes
- **Reserva** (Reservation): Many-to-One with Mesa
- **CierreCaja** (Cash Register Closure): Many-to-One with Usuario, unique per date
  - Tracks daily sales, payments by method, expected vs actual cash, and discrepancies

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

## Authentication & Authorization

### Default Users
Created by `DataInitializer` on first startup:
- Admin: admin@sailor.com / admin123 (role: ADMIN)
- User: user@sailor.com / user123 (role: USER - limited access)

**Note**: The default `USER` role has very limited access. For production use, create users with specific roles (MESERO, COCINA, CAJA, INVENTARIO, GERENCIA) via the `/usuarios` endpoint (ADMIN only).

### Roles & Permissions
| Role | Permissions |
|------|-------------|
| `ADMIN` | Full system access |
| `MESERO` | Tables, orders, reservations |
| `COCINA` | View active orders, update order status |
| `CAJA` | Invoices, payments, cash register closure |
| `INVENTARIO` | Ingredients, recipes, inventory movements |
| `GERENCIA` | Reports and analytics |

To add or modify users, use the UsuarioController endpoints (requires ADMIN role).

## API Endpoints

All endpoints require JWT Bearer token authentication except `/auth/**` and `/health`. Access is restricted by role.

### Public Endpoints (no authentication required)
- `GET /health` - Health check
- `POST /auth/login` - Login (returns accessToken, refreshToken, email, rol)
- `POST /auth/refresh` - Refresh access token using refresh token

### Protected Endpoints (require Bearer token + specific roles)

#### User Management (ADMIN only)
- `GET /usuarios` - List all users
- `POST /usuarios` - Create new user
- `PATCH /usuarios/{id}/rol` - Update user role

#### Tables (ADMIN, MESERO)
- `GET /mesas` - List all tables
- `POST /mesas` - Create table
- `PUT /mesas/{id}` - Update table
- `DELETE /mesas/{id}` - Delete table

#### Products (ADMIN only)
- `GET /productos` - List all products
- `POST /productos` - Create product
- `PUT /productos/{id}` - Update product
- `DELETE /productos/{id}` - Delete product

#### Orders (ADMIN, MESERO for creation; COCINA can view active and update status)
- `GET /pedidos` - List all orders (ADMIN, MESERO)
- `GET /pedidos/activos` - List active orders (ADMIN, MESERO, COCINA)
- `GET /pedidos/{id}` - Get order by ID (ADMIN, MESERO)
- `POST /pedidos` - Create order (ADMIN, MESERO) - requires `mesaId`, `items[]`, optional `observaciones`
- `PATCH /pedidos/{id}/estado` - Update order status (ADMIN, MESERO, COCINA)

#### Invoices (ADMIN, CAJA)
- `GET /facturas` - List all invoices
- `POST /facturas` - Create invoice from order

#### Payments (ADMIN, CAJA)
- `GET /pagos` - List all payments
- `POST /pagos` - Register payment (metodoPago: EFECTIVO or TARJETA)

#### Inventory (ADMIN, INVENTARIO)
- `GET /insumos` - List ingredients/supplies
- `POST /insumos` - Create ingredient
- `GET /recetas` - List recipes
- `POST /recetas` - Create recipe linking products to ingredients

#### Reservations (ADMIN, MESERO)
- `GET /reservas` - List reservations
- `POST /reservas` - Create reservation

#### Reports (ADMIN, GERENCIA)
- `GET /reportes/*` - Various analytics and reports

#### Cash Register Closure (ADMIN, CAJA)
- `GET /cierre-caja` - List cash register closures
- `POST /cierre-caja` - Create daily cash register closure
- `GET /cierre-caja/resumen/{fecha}` - Get summary for a specific date

## Making Changes

### Adding a new entity
1. Create entity in `backend/src/main/java/com/sailor/entity/`
2. Create repository in `backend/src/main/java/com/sailor/repository/`
3. Create DTOs for request/response in `backend/src/main/java/com/sailor/dto/`
4. Create service if business logic needed in `backend/src/main/java/com/sailor/service/`
5. Create controller for REST endpoints in `backend/src/main/java/com/sailor/controller/`
6. Add role-based security rules in [SecurityConfig.java](backend/src/main/java/com/sailor/config/SecurityConfig.java)

### Adding a new frontend page
1. Create page component in `frontend/src/` (e.g., `MyPage.jsx`)
2. Add route in [App.jsx](frontend/src/App.jsx)
3. Add navigation link in [App.jsx](frontend/src/App.jsx) nav bar (use `hasRole()` to show/hide based on user role)
4. Use `useAuth()` hook for:
   - Getting authentication headers: `getAuthHeader()`
   - Checking user role: `hasRole('ADMIN')`
   - Accessing user info: `email`, `rol`, `isAuthenticated`

### Modifying security and RBAC
Edit [backend/src/main/java/com/sailor/config/SecurityConfig.java](backend/src/main/java/com/sailor/config/SecurityConfig.java):
- CSRF is disabled for API use
- All endpoints require authentication by default
- Use `.requestMatchers("/path/**").permitAll()` to make endpoints public
- Use `.requestMatchers("/path/**").hasRole("ROLE_NAME")` for single role
- Use `.requestMatchers("/path/**").hasAnyRole("ROLE1", "ROLE2")` for multiple roles
- **Important**: Spring Security expects roles WITHOUT the "ROLE_" prefix in `.hasRole()` (e.g., use `"ADMIN"` not `"ROLE_ADMIN"`)

### Order State Workflow
When working with orders, respect the state machine defined in [PedidoEstado.java](backend/src/main/java/com/sailor/entity/PedidoEstado.java):
- Valid states: `PENDIENTE` → `PREPARACION` → `LISTO` → `ENTREGADO`
- Invalid transitions are rejected by `PedidoEstado.isValidTransition()`
- Use `PATCH /pedidos/{id}/estado` to transition between states
