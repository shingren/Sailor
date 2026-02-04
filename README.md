# Sailor – Restaurant and Bar Management System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Java](https://img.shields.io/badge/Java-21-orange.svg)](https://adoptium.net/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.0-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)

Comprehensive management system designed specifically for restaurants, bars, and food service establishments. Sailor provides complete control over daily operations including point of sale (POS), table management, kitchen operations, inventory, invoicing, cash register closure, reservations, and analytical reports.

## Key Features

- **Table Management (Floor Plan)**: Visual table administration with real-time status (available, occupied, reserved)
- **Point of Sale (POS)**: Complete order system with product catalog, quantities, and notes
- **Kitchen Operations**: Specialized view for kitchen staff with order status tracking (Pending, Preparation, Ready, Delivered)
- **Inventory Management**: Ingredient control with current stock, minimum levels, movements (PURCHASE, ADJUSTMENT, CONSUMPTION), and product recipes
- **Invoicing**: Invoice generation from orders with multiple payment support (Cash, Card)
- **Cash Register Closure**: Daily sales summary, comparison between expected and actual balance, closure history
- **Reservations**: Table reservation management by time slot with availability validation
- **Reports**: Daily sales analysis, sales by product, orders by status, ingredient consumption, and reservations
- **Staff Management (RBAC)**: Role-based access control (ADMIN, MESERO, COCINA, CAJA, INVENTARIO, GERENCIA)
- **Secure Authentication**: JWT system with access tokens (15 min) and refresh tokens (7 days)

## Architecture Overview

### Backend
- **Language**: Java 21
- **Framework**: Spring Boot 3.3.0
- **Database**: MySQL 8
- **ORM**: Hibernate JPA
- **Security**: Spring Security + JWT (JJWT 0.12.3)
- **Build Tool**: Maven

### Frontend
- **Framework**: React 18
- **Bundler**: Vite
- **Routing**: React Router DOM
- **State Management**: Context API (AuthContext)
- **Styling**: Custom CSS

### Infrastructure
- **Orchestration**: Docker + Docker Compose
- **Reverse Proxy**: Nginx with HTTPS support
- **Certificates**: Self-signed SSL/TLS (development)
- **Hot Reload**: Vite HMR with WebSocket enabled

### Container Architecture
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

## Prerequisites

### For Docker Execution (Recommended)
- [Docker](https://www.docker.com/get-started) 20.10+
- [Docker Compose](https://docs.docker.com/compose/install/) 2.0+

### For Execution Without Docker
- [Java JDK 21](https://adoptium.net/)
- [Maven 3.8+](https://maven.apache.org/download.cgi)
- [Node.js 18+](https://nodejs.org/) (with npm)
- [MySQL 8.0+](https://dev.mysql.com/downloads/mysql/)

## Installation and Execution

### Option 1: Docker Compose (Recommended)

This is the fastest and easiest way to run the complete stack.

1. **Clone the repository**
   ```bash
   git clone https://github.com/AArCh95/Sailor.git
   cd Sailor
   ```

2. **Start all services**
   ```bash
   docker compose up -d --build
   ```

3. **Access the application**
   - HTTPS (production): https://localhost
   - HTTP: http://localhost (automatically redirects to HTTPS)
   - Direct API: http://localhost:8080
   - Direct frontend: http://localhost:5173

4. **Ports used**
   - `80`: HTTP (redirects to HTTPS)
   - `443`: HTTPS (Nginx)
   - `8080`: Backend API (Spring Boot)
   - `5173`: Frontend Dev Server (Vite)
   - `3307`: MySQL (port exposed on host)

5. **Default users**
   - Admin: `admin@sailor.com` / `admin123`
   - User: `user@sailor.com` / `user123`

6. **Stop services**
   ```bash
   docker compose down
   ```

7. **Remove volumes (reset database)**
   ```bash
   docker compose down -v
   ```

### Option 2: Backend Without Docker

1. **Configure local MySQL**
   - Create database: `sailor`
   - User: `sailor` / Password: `sailor123`
   - Port: `3307` (or `3306` depending on your installation)

2. **Update configuration** (if needed)

   Edit `backend/src/main/resources/application.yml`:
   ```yaml
   spring:
     datasource:
       url: jdbc:mysql://localhost:3307/sailor
   ```

3. **Build and run**
   ```bash
   cd backend
   mvn clean package
   mvn spring-boot:run
   ```

   Or run directly:
   ```bash
   mvn clean package
   java -jar target/sailor-0.0.1-SNAPSHOT.jar
   ```

4. **Access the API**
   - http://localhost:8080

### Option 3: Frontend Without Docker

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure proxy (if needed)**

   Verify `frontend/vite.config.js`:
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

3. **Run development server**
   ```bash
   npm run dev
   ```

4. **Access the application**
   - http://localhost:5173

5. **Build for production**
   ```bash
   npm run build
   ```

## Project Structure

```
Sailor/
├── backend/                    # Spring Boot Backend
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/sailor/
│   │   │   │   ├── config/        # Configuration (Security, CORS, DataInitializer)
│   │   │   │   ├── controller/    # REST Controllers
│   │   │   │   ├── dto/           # Data Transfer Objects
│   │   │   │   ├── entity/        # JPA Entities
│   │   │   │   ├── repository/    # Spring Data Repositories
│   │   │   │   ├── service/       # Business Logic
│   │   │   │   └── SailorApplication.java
│   │   │   └── resources/
│   │   │       └── application.yml
│   │   └── test/
│   ├── Dockerfile
│   └── pom.xml
│
├── frontend/                   # React + Vite Frontend
│   ├── src/
│   │   ├── App.jsx            # Main component and router
│   │   ├── AuthContext.jsx   # Authentication context
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
├── nginx/                      # Nginx Configuration
│   ├── nginx.conf
│   └── certs/                 # Self-signed SSL certificates
│
├── docker-compose.yml         # Container orchestration
├── .gitignore
├── README.md
├── CLAUDE.md                  # Claude Code instructions
├── CONTRIBUTING.md            # Contributor guide
└── SETUP.md                   # Detailed setup guide
```

## API Endpoints

### Public (no authentication required)
- `GET /health` - Health check
- `POST /auth/login` - Login
- `POST /auth/refresh` - Refresh access token

### Protected (require Bearer token)
- **Tables**: `GET /mesas`, `POST /mesas`
- **Products**: `GET /productos`, `POST /productos`
- **Orders**: `GET /pedidos`, `POST /pedidos`, `GET /pedidos/{id}`
- **Invoices**: `GET /facturas`, `POST /facturas`
- **Payments**: `POST /pagos`
- **Ingredients**: `GET /insumos`, `POST /insumos`, `PUT /insumos/{id}`
- **Movements**: `GET /insumos/movimientos`, `POST /insumos/movimientos`
- **Recipes**: `GET /recetas`, `POST /recetas`
- **Reservations**: `GET /reservas`, `POST /reservas`, `POST /reservas/{id}/cancelar`
- **Reports**: `GET /reportes/*`
- **Users** (ADMIN only): `GET /usuarios`, `POST /usuarios`, `PUT /usuarios/{id}/rol`, `DELETE /usuarios/{id}`
- **Cash Register**: `GET /cierre-caja`, `POST /cierre-caja`, `GET /cierre-caja/resumen-dia`

## Contributor Guide

This project uses a Git-based workflow with feature branches and Pull Requests.

### Basic Workflow

1. **Clone the repository** (if you haven't already)
   ```bash
   git clone https://github.com/AArCh95/Sailor.git
   cd Sailor
   ```

2. **Update your local copy**
   ```bash
   git checkout main
   git pull origin main
   ```

3. **Create a new branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

   Branch naming conventions:
   - `feature/` - New functionality
   - `fix/` - Bug fixes
   - `ui/` - Interface improvements
   - `refactor/` - Code refactoring
   - `docs/` - Documentation

4. **Make your changes and commit**
   ```bash
   git add .
   git commit -m "Clear description of changes"
   ```

5. **Push your branch**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Open a Pull Request** on GitHub targeting the `main` branch

### Commit Standards

- Use descriptive commit messages in English
- Be specific about what changed and why
- Examples:
  - ✅ "Add stock validation to order creation"
  - ✅ "Fix cash register closure difference calculation"
  - ❌ "Fix bug"
  - ❌ "Update"

### Before Making a Pull Request

1. Ensure the code compiles without errors
   ```bash
   # Backend
   cd backend && mvn clean package

   # Frontend
   cd frontend && npm run build
   ```

2. Test your changes with Docker Compose
   ```bash
   docker compose up --build
   ```

3. Verify you haven't included sensitive files (`.env`, credentials, etc.)

For more details, see [CONTRIBUTING.md](./CONTRIBUTING.md).

## Security Notes

### Environment Variables
- **NEVER** commit `.env` files to the repository
- **NEVER** include credentials, API keys, or secrets in code
- Use environment variables for sensitive configuration

### SSL Certificates
- Certificates in `nginx/certs/` are **self-signed** and for development only
- In production, use valid certificates (Let's Encrypt, etc.)

### JWT Secrets
- JWT secret key is in `application.yml` for development
- In production, use environment variables or secret management services

### Database
- Default credentials are for local development only
- In production, use strong passwords and rotate periodically

## License

This project is licensed under the **MIT License** - see the [LICENSE](./LICENSE) file for details.

## Security

To report security vulnerabilities, see our [Security Policy](./SECURITY.md).

**⚠️ Important for Production:**
- Change all default credentials (database, users, JWT secret)
- Use valid SSL/TLS certificates (not the included self-signed ones)
- Configure environment variables for secrets (see `.env.example`)
- Review the [Security Policy](./SECURITY.md) for best practices

## Disclaimer

This software is provided "as is", without warranty of any kind. See the [MIT LICENSE](./LICENSE) for more information.

## Contributions

Contributions are welcome! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for the process.

---

**Built with ❤️ for the food service industry**
