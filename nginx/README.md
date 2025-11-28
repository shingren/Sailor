# Nginx Reverse Proxy Setup

This directory contains the Nginx configuration for the Sailor application's reverse proxy with HTTPS support.

## SSL Certificate Generation

The application uses **mkcert** to generate self-signed certificates for local development with HTTPS.

### Installation

#### macOS
```bash
brew install mkcert
mkcert -install
```

#### Linux
```bash
# Install mkcert
curl -JLO "https://dl.filippo.io/mkcert/latest?for=linux/amd64"
chmod +x mkcert-v*-linux-amd64
sudo cp mkcert-v*-linux-amd64 /usr/local/bin/mkcert

# Install local CA
mkcert -install
```

#### Windows
```powershell
# Using Chocolatey
choco install mkcert

# Or download from: https://github.com/FiloSottile/mkcert/releases
# Then run:
mkcert -install
```

### Generate Certificates

#### Option 1: Using mkcert (Recommended)

Once mkcert is installed, generate the certificates for localhost:

```bash
cd nginx/certs
mkcert localhost
```

#### Option 2: Using OpenSSL (Alternative)

If mkcert is not available, use openssl to generate self-signed certificates:

**macOS/Linux:**
```bash
cd nginx/certs
openssl req -x509 -newkey rsa:4096 -nodes -keyout localhost-key.pem -out localhost.pem -days 365 -subj "/CN=localhost"
```

**Windows (Git Bash):**
```bash
cd nginx/certs
MSYS_NO_PATHCONV=1 openssl req -x509 -newkey rsa:4096 -nodes -keyout localhost-key.pem -out localhost.pem -days 365 -subj "/CN=localhost"
```

Both methods create two files:
- `localhost.pem` - SSL certificate
- `localhost-key.pem` - SSL certificate key

These files are already configured in [nginx.conf](nginx.conf) and [docker-compose.yml](../docker-compose.yml).

**Note:** Browsers will show a security warning for self-signed certificates generated with openssl. This is normal for local development. Use mkcert for a better experience without warnings.

## Configuration

The Nginx reverse proxy is configured to:
- **HTTP → HTTPS redirect**: All HTTP (port 80) requests are redirected to HTTPS (port 443)
- **Reverse proxy rules**:
  - `/api/*` → Spring Boot backend (`http://api:8080/`)
  - `/*` → React frontend with Vite dev server (`http://web:5173/`)
- **WebSocket support**: Enabled for Vite Hot Module Replacement (HMR)

## Running

Start the full stack with:

```bash
docker compose up
```

Access the application at:
- **HTTPS**: https://localhost
- HTTP requests to http://localhost will automatically redirect to HTTPS

## Troubleshooting

### Certificate not trusted
If your browser shows a certificate warning:
1. Run `mkcert -install` to install the local CA
2. Regenerate certificates with `mkcert localhost`
3. Restart the nginx container

### Nginx fails to start
Check that certificate files exist in `nginx/certs/`:
```bash
ls nginx/certs/
# Should show: localhost.pem localhost-key.pem
```
