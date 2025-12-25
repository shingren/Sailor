# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sailor is a restaurant management system built with a Spring Boot backend and React frontend, running on Docker with Nginx reverse proxy. The application manages tables (mesas), products (productos), accounts/tabs (cuentas), orders (pedidos), customers (clientes), invoices (facturas), payments (pagos), inventory (insumos), recipes (recetas), reservations (reservas), and cash register closures (cierre de caja) with JWT authentication and role-based access control (RBAC).

**Key architectural feature**: The system supports both legacy per-order (pedido) invoicing and modern account-based (cuenta) invoicing, allowing multiple orders to be grouped under a single account/tab before generating an invoice.

## Architecture

### Backend (Spring Boot 3.3.0 + Java 21)
- **Package structure**: `com.sailor.*`
  - `entity`: JPA entities (Mesa, Producto, Pedido, PedidoItem, PedidoItemExtra, PedidoEstado, Usuario, Cuenta, CuentaEstado, Cliente, Factura, Pago, Insumo, Receta, RecetaItem, RecetaExtra, MovimientoInsumo, Reserva, CierreCaja, Location)
  - `repository`: Spring Data JPA repositories
  - `service`: Business logic (PedidoService, CuentaService, FacturaService, ClienteService, InsumoService, RecetaService, ReservaService, CierreCajaService, UsuarioService, DashboardService, JwtUtil, CustomUserDetailsService)
  - `controller`: REST controllers (MesaController, ProductoController, PedidoController, CuentaController, ClienteController, FacturaController, PagoController, InsumoController, RecetaController, ReservaController, ReporteController, DashboardController, CierreCajaController, UsuarioController, LocationController, AuthController, HealthController)
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
  - Token refresh is automatic when access token expires
- **Components**: TopBar (navigation header), Sidebar (collapsible menu), NotAuthorized (403 page), MenuGridView (product selection grid)
- **Pages**: HomePage, LoginPage, MesasPage, FloorplanPage, ProductosPage, PedidosPage, FacturasPage, InventarioPage, ReservasPage, CocinaPage, ReportesPage, StaffPage, CierreCajaPage
  - All pages follow consistent patterns: loading states, error handling, and authentication checks
  - Spanish language UI throughout the application
- **MenuGridView**: Grid-based product selection component for point-of-sale (POS) functionality
  - Visual product catalog with categories
  - Supports adding products to orders with quantities and extras
  - Integrates with order management workflow
- **FloorplanPage**: Interactive canvas-based floor plan for visual table management
  - Drag-and-drop table positioning with location filtering
  - Pan and zoom controls for large floor plans
  - Real-time table status visualization (available, occupied, reserved)
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
- **Mesa**: Standalone table entity with optional Many-to-One relationship to Location
  - Can have x, y coordinates for FloorplanPage visual positioning
- **Location**: Standalone entity for organizing tables into areas/zones (e.g., "Patio", "Interior", "Bar")
- **Usuario**: User entity with `rol` field (ADMIN, MESERO, COCINA, CAJA, INVENTARIO, GERENCIA)
- **Producto**: Standalone product catalog
- **Cuenta** (Account/Tab): Represents a table's account for grouping multiple orders
  - Has `estado` field (enum: ABIERTA → CON_FACTURA → CERRADA)
  - Many-to-One with Mesa (belongs to a table)
  - One-to-Many with Pedido (can contain multiple orders)
  - One-to-One with Factura (generates one invoice for all orders in the account)
  - Tracks `creadaPorUsuario` (who opened the account)
  - State transitions: ABIERTA (accepting orders) → CON_FACTURA (invoice generated) → CERRADA (paid and closed)
- **Cliente** (Customer): Customer information for fiscal/invoicing purposes
  - Fields: nombre, identificacionFiscal (unique), direccion, email, telefono, activo
  - Used to associate customer data with facturas
  - `identificacionFiscal` is required and unique (tax ID / fiscal identification)
- **Pedido**: One-to-Many with PedidoItem, Many-to-One with Mesa, optional Many-to-One with Cuenta
  - Has `estado` field (string: PENDIENTE → PREPARACION → LISTO)
  - State transitions are validated (see PedidoEstado enum)
  - **Note**: ENTREGADO state has been removed from the workflow
  - Can belong to a Cuenta (for grouped invoicing) or be standalone (legacy per-pedido invoicing)
  - **Facturación**: Orders can generate facturas either individually (legacy) or as part of a Cuenta (new model)
- **PedidoItem**: Many-to-One with both Pedido and Producto, One-to-Many with PedidoItemExtra
  - Order creation is transactional and automatically sets `precioUnitario` from current product price
- **PedidoItemExtra**: Many-to-One with both PedidoItem and RecetaExtra
  - Tracks extras/add-ons selected for a specific order item
  - Stores quantity and price at time of order
- **Factura** (Invoice): One-to-Many with Pago, optional One-to-One with Pedido (legacy), optional One-to-One with Cuenta (new model), optional Many-to-One with Cliente
  - Has `estado` field (enum FacturaEstado: PENDIENTE, PAGADA)
  - **Dual invoicing model**: Supports both legacy (one factura per pedido) and new (one factura per cuenta)
    - Legacy: One-to-One with Pedido (unique constraint on pedido_id)
    - New: One-to-One with Cuenta (unique constraint on cuenta_id)
  - **Cliente relationship**: Optional Many-to-One with Cliente for fiscal purposes
    - Factura freezes cliente data at time of invoice creation (snapshot fields: clienteIdentificacionFiscal, clienteNombre, clienteDireccion, clienteEmail, clienteTelefono)
    - Snapshot ensures historical accuracy even if cliente data is modified later
  - Tracks `creadaPorUsuario` (who created the invoice) and `fechaHoraPago` (when payment was completed)
  - When totalPagado >= total, estado changes to PAGADA
  - For legacy model: When factura is paid, pedido estado may change to PAGADO
  - For cuenta model: When factura is paid, cuenta estado changes to CERRADA
- **Pago** (Payment): Many-to-One with Factura, has `metodoPago` field (EFECTIVO, TARJETA)
- **Insumo** (Ingredient): Standalone ingredient/supply entity with stock tracking
  - Fields: nombre, unidad, stockActual, stockMinimo
  - Stock is modified only through MovimientoInsumo, not directly
  - Supports editing via PUT endpoint (nombre, unidad, stockMinimo only)
- **Receta** (Recipe): One-to-Many with RecetaItem and RecetaExtra, Many-to-One with Producto
- **RecetaItem**: Many-to-One with both Receta and Insumo (defines base ingredients for a product)
- **RecetaExtra**: Many-to-One with both Receta and Insumo (defines optional add-ons/extras for a product)
  - Each extra has a name, price, and ingredient cost (cantidadInsumo)
  - Examples: extra cheese, bacon, guacamole
- **MovimientoInsumo** (Inventory Movement): Many-to-One with Insumo, tracks stock changes
  - Types: COMPRA (purchase, positive), AJUSTE (adjustment, can be +/-), CONSUMO (consumption, negative)
  - Automatically updates Insumo.stockActual on creation
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

### Testing

**Note**: This project currently uses integration testing via shell scripts rather than unit tests.

#### Integration Test Scripts
Located in the root directory as `test_*.sh` files. These scripts test end-to-end workflows by making HTTP requests to the API.

**Common test scripts:**
```bash
# Test cuenta-based invoicing workflow
./test_ordenes_por_cuenta.sh

# Test invoice estado management
./test_estados_factura.sh

# Test client fiscal data snapshot
./test_cliente_identificacion_snapshot.sh

# Test role-based access control
./test_flujo_sin_entregado_roles.sh

# Test price update (admin-only)
./test_precio_admin_only.sh
```

**Requirements for running test scripts:**
- Backend must be running (via `docker compose up` or `mvn spring-boot:run`)
- Scripts use `curl` to make API calls
- Test scripts automatically log in and use JWT tokens for authenticated requests
- Each script tests a specific feature or workflow and outputs results

**Note**: When adding new features, consider adding corresponding integration test scripts following the existing patterns.

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
- User: user@sailor.com / user123 (role: MESERO)

**Note**: For production use, create additional users with specific roles (MESERO, COCINA, CAJA, INVENTARIO, GERENCIA) via the StaffPage UI or `/usuarios` endpoint (ADMIN only).

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
- `POST /usuarios` - Create new user (requires email, password, rol)
- `PUT /usuarios/{id}/rol` - Update user role (requires rol in body)
- `DELETE /usuarios/{id}` - Delete user

#### Tables (ADMIN, MESERO)
- `GET /mesas` - List all tables
- `POST /mesas` - Create table
- `PUT /mesas/{id}` - Update table (including x, y coordinates for floorplan)
- `DELETE /mesas/{id}` - Delete table

#### Locations (ADMIN, MESERO)
- `GET /locations` - List all locations/zones
- `POST /locations` - Create location
- `DELETE /locations/{id}` - Delete location

#### Products (ADMIN only)
- `GET /productos` - List all products
- `POST /productos` - Create product
- `PUT /productos/{id}` - Update product
- `DELETE /productos/{id}` - Delete product

#### Orders (ADMIN, MESERO for creation; COCINA can view active and update status)
- `GET /pedidos` - List all orders (ADMIN, MESERO)
- `GET /pedidos/activos` - List active orders (ADMIN, MESERO, COCINA)
- `GET /pedidos/{id}` - Get order by ID (ADMIN, MESERO)
- `POST /pedidos` - Create order (ADMIN, MESERO) - requires `mesaId`, `items[]` (with optional `extras[]`), optional `cuentaId`, optional `observaciones`
- `PATCH /pedidos/{id}/estado` - Update order status (ADMIN, MESERO, COCINA)
- `GET /pedidos/listos-facturar` - Get orders ready for invoicing (legacy endpoint)

#### Cuentas/Accounts (ADMIN, MESERO, CAJA)
- `GET /cuentas` - List all accounts
- `GET /cuentas/abiertas` - List open accounts (estado: ABIERTA)
- `GET /cuentas/{id}` - Get account by ID (includes all pedidos)
- `POST /cuentas` - Create new account (requires mesaId)
- `PATCH /cuentas/{id}/estado` - Update account status
- `GET /cuentas/mesa/{mesaId}` - Get accounts for a specific table

#### Customers (ADMIN, CAJA)
- `GET /clientes` - List all customers
- `GET /clientes/{id}` - Get customer by ID
- `POST /clientes` - Create customer (requires nombre, identificacionFiscal)
- `PUT /clientes/{id}` - Update customer information
- `DELETE /clientes/{id}` - Deactivate customer (soft delete, sets activo=false)

#### Invoices (ADMIN, CAJA)
- `GET /facturas` - List all invoices
- `POST /facturas` - Create invoice from pedido (legacy) or cuenta (new model)
  - For cuenta-based: requires `cuentaId`, optional `clienteId`, `descuento`
  - For pedido-based: requires `pedidoId` (legacy support)

#### Payments (ADMIN, CAJA)
- `GET /pagos` - List all payments
- `POST /pagos` - Register payment (metodoPago: EFECTIVO or TARJETA)

#### Inventory (ADMIN, INVENTARIO)
- `GET /insumos` - List ingredients/supplies
- `POST /insumos` - Create ingredient (nombre, unidad, stockActual, stockMinimo)
- `PUT /insumos/{id}` - Update ingredient (nombre, unidad, stockMinimo only - stock modified via movements)
- `GET /insumos/movimientos` - List inventory movements
- `POST /insumos/movimientos` - Create movement (insumoId, cantidad, tipo: COMPRA/AJUSTE/CONSUMO, descripcion)
- `GET /recetas` - List recipes
- `POST /recetas` - Create recipe linking products to ingredients (includes base items and optional extras)
- `PUT /recetas/{id}` - Update recipe (including items and extras)

#### Reservations (ADMIN, MESERO)
- `GET /reservas` - List reservations
- `POST /reservas` - Create reservation

#### Reports (ADMIN, GERENCIA)
- `GET /reportes/*` - Various analytics and reports

#### Dashboard (ADMIN, GERENCIA)
- `GET /dashboard/*` - Dashboard metrics and statistics

#### Cash Register Closure (ADMIN, CAJA)
- `GET /cierre-caja` - List all cash register closures
- `POST /cierre-caja` - Create daily cash register closure (saldoReal, saldoInicial)
- `GET /cierre-caja/resumen-dia?saldoInicial={amount}` - Get summary for today (optional saldoInicial query param)
  - Returns: fecha, totalVentasDia, totalEfectivo, totalTarjeta, cantidadFacturas, saldoEsperado, cierreExiste

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

### Order and Account State Workflows

#### Order (Pedido) State Workflow
When working with orders, respect the state machine defined in [PedidoEstado.java](backend/src/main/java/com/sailor/entity/PedidoEstado.java):
- Valid states: `PENDIENTE` → `PREPARACION` → `LISTO`
- **Note**: The `ENTREGADO` and `PAGADO` states have been removed from the workflow
- Invalid transitions are rejected by `PedidoEstado.isValidTransition()`
- Use `PATCH /pedidos/{id}/estado` to transition between states

#### Account (Cuenta) State Workflow
When working with accounts, respect the state machine defined in [CuentaEstado.java](backend/src/main/java/com/sailor/entity/CuentaEstado.java):
- Valid states: `ABIERTA` → `CON_FACTURA` → `CERRADA`
- State transitions:
  - `ABIERTA`: Account is open, accepting new pedidos
  - `CON_FACTURA`: Invoice has been generated for the account (cannot add more pedidos)
  - `CERRADA`: Invoice has been paid and account is closed
- Invalid transitions are rejected by `CuentaEstado.isValidTransition()`
- Use `PATCH /cuentas/{id}/estado` to transition between states (typically automated by the system)

### Inventory Management Patterns
When working with inventory:
- **Never modify stockActual directly** - always use MovimientoInsumo
- **Editing insumos**: Use PUT /insumos/{id} with InsumoUpdateRequestDTO (nombre, unidad, stockMinimo)
  - stockActual is read-only and managed through movements
- **Movement types**:
  - `COMPRA`: Purchase/restocking (positive quantity)
  - `AJUSTE`: Stock adjustment (can be positive or negative)
  - `CONSUMO`: Usage/consumption (negative quantity, typically from recipe execution)
- **Stock validation**: Movements that would result in negative stock are rejected

### Recipe Extras/Add-ons Pattern
The system supports optional extras (add-ons) for products:
- **RecetaExtra**: Defines available extras for a product (e.g., "Extra Queso", "Tocino")
  - Each extra has: name, price, associated insumo, and cantidadInsumo (ingredient cost)
- **PedidoItemExtra**: Tracks which extras were selected when ordering
  - Links to PedidoItem and RecetaExtra
  - Stores quantity and price at time of order (price freezing)
- **Creating orders with extras**: Include `extras` array in each item when POSTing to `/pedidos`
  - Each extra should specify `recetaExtraId` and `cantidad`
- **Inventory impact**: When creating orders, extras consume inventory through their associated insumos

### Account (Cuenta) Management Pattern
The system supports grouped invoicing via the Cuenta (Account/Tab) entity:
- **Workflow**:
  1. Open a new Cuenta for a Mesa: `POST /cuentas` with `mesaId`
  2. Create Pedidos associated with the Cuenta: `POST /pedidos` with `cuentaId`
  3. When ready to pay, generate a Factura for the entire Cuenta: `POST /facturas` with `cuentaId`
  4. Process payment(s): `POST /pagos` with `facturaId`
  5. When fully paid, the Cuenta automatically transitions to CERRADA
- **Benefits**: Allows multiple orders to be grouped under one account before invoicing (e.g., customers ordering multiple rounds)
- **Legacy support**: The system still supports the old per-pedido invoicing model for backward compatibility
- **Estado management**: Cuenta estado is typically managed automatically by the system when facturas are created/paid

### Cliente Data Snapshot Pattern
The Factura entity implements a snapshot pattern for cliente (customer) fiscal data:
- **Purpose**: Preserve customer information as it existed at the time of invoicing for legal/audit compliance
- **Implementation**:
  - Factura has a Many-to-One relationship with Cliente (optional)
  - Factura also has snapshot fields: `clienteIdentificacionFiscal`, `clienteNombre`, `clienteDireccion`, `clienteEmail`, `clienteTelefono`
  - When creating a factura with a cliente, copy cliente data into these snapshot fields
  - Snapshot data remains unchanged even if the Cliente entity is later modified
- **Benefits**: Historical accuracy for fiscal records, audit trails, and legal compliance
- **Creating facturas with cliente**: Include `clienteId` when POSTing to `/facturas`, and the system will automatically snapshot the data

### Floorplan and Location Management
The FloorplanPage provides a visual, interactive floor plan for managing tables:
- **Canvas-based rendering**: Uses HTML5 Canvas for high-performance table visualization
- **Drag-and-drop**: Tables can be repositioned by dragging on the canvas
  - Table positions (x, y coordinates) are saved to the database via PUT /mesas/{id}
- **Location filtering**: Filter tables by location/zone (e.g., show only "Patio" tables)
- **Pan and zoom**: Navigate large floor plans with mouse drag (pan) and scroll wheel (zoom)
- **Real-time status**: Tables display current status with color coding (available, occupied, reserved)
- **Location entity**: Use the Location entity to organize tables into zones
  - Create locations via POST /locations
  - Assign tables to locations when creating/updating mesas
- **Coordinate system**: Tables are positioned using pixel coordinates relative to canvas origin (top-left)

### Common Frontend Patterns
All page components follow these conventions:
1. **Authentication check**: Redirect to login if not authenticated
2. **Loading state**: Show loading indicator while fetching data
3. **Error handling**: Display error messages in alert components
4. **Success feedback**: Show success messages after mutations
5. **Authorization**: Use `getAuthHeader()` for all API calls
6. **Role-based rendering**: Use `hasRole()` to conditionally show/hide features
7. **Spanish UI**: All user-facing text is in Spanish
