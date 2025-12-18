#!/bin/bash

# Test script for Per-Pedido Fiscal Data UI Implementation
# This script validates the backend behavior that supports the new UI:
# - Creating 2 ENTREGADO pedidos
# - Generating facturas with DIFFERENT fiscal data for each
# - Verifying state isolation (pedido #1 data doesn't affect pedido #2)
# - Verifying snapshots are saved correctly per pedido

set -e

API_URL="http://localhost:8080"
ADMIN_USER="admin@sailor.com"
ADMIN_PASS="admin123"

echo "=============================================="
echo "TEST: Per-Pedido Fiscal Data (Backend Validation)"
echo "=============================================="
echo

# Function to login and get access token
login() {
    echo "[INFO] Logging in as $ADMIN_USER..."
    RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$ADMIN_USER\",\"password\":\"$ADMIN_PASS\"}")

    TOKEN=$(echo "$RESPONSE" | grep -o '"accessToken":"[^"]*"' | sed 's/"accessToken":"\([^"]*\)"/\1/')

    if [ -z "$TOKEN" ]; then
        echo "[ERROR] Failed to login. Response: $RESPONSE"
        exit 1
    fi

    echo "[SUCCESS] Logged in successfully"
    echo
}

# Function to create a test mesa
create_mesa() {
    echo "[INFO] Creating test mesa..."
    RESPONSE=$(curl -s -X POST "$API_URL/mesas" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN" \
        -d "{\"codigo\":\"TEST-UI-$RANDOM\",\"capacidad\":4,\"estado\":\"disponible\"}")

    MESA_ID=$(echo "$RESPONSE" | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')

    if [ -z "$MESA_ID" ]; then
        echo "[ERROR] Failed to create mesa. Response: $RESPONSE"
        exit 1
    fi

    echo "[SUCCESS] Mesa created with ID: $MESA_ID"
    echo
}

# Function to create a test producto
create_producto() {
    echo "[INFO] Creating test producto..."
    RESPONSE=$(curl -s -X POST "$API_URL/productos" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN" \
        -d "{\"nombre\":\"Test Product $RANDOM\",\"descripcion\":\"Test\",\"precio\":20.00,\"categoria\":\"PLATO_PRINCIPAL\",\"disponible\":true}")

    PRODUCTO_ID=$(echo "$RESPONSE" | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')

    if [ -z "$PRODUCTO_ID" ]; then
        echo "[ERROR] Failed to create producto. Response: $RESPONSE"
        exit 1
    fi

    echo "[SUCCESS] Producto created with ID: $PRODUCTO_ID"
    echo
}

# Function to create a pedido and transition to ENTREGADO
create_pedido_entregado() {
    echo "[INFO] Creating pedido..."
    RESPONSE=$(curl -s -X POST "$API_URL/pedidos" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN" \
        -d "{\"mesaId\":$MESA_ID,\"items\":[{\"productoId\":$PRODUCTO_ID,\"cantidad\":2}]}")

    PEDIDO_ID=$(echo "$RESPONSE" | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')

    if [ -z "$PEDIDO_ID" ]; then
        echo "[ERROR] Failed to create pedido. Response: $RESPONSE"
        exit 1
    fi

    echo "[SUCCESS] Pedido created with ID: $PEDIDO_ID"

    # Transition: PENDIENTE -> PREPARACION -> LISTO -> ENTREGADO
    echo "[INFO] Transitioning pedido to ENTREGADO..."

    echo "[DEBUG] PENDIENTE -> PREPARACION"
    RESP1=$(curl -s -X PATCH "$API_URL/pedidos/$PEDIDO_ID/estado" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN" \
        -d '{"estado":"PREPARACION"}')
    echo "[DEBUG] Response: $RESP1"
    sleep 1

    echo "[DEBUG] PREPARACION -> LISTO"
    RESP2=$(curl -s -X PATCH "$API_URL/pedidos/$PEDIDO_ID/estado" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN" \
        -d '{"estado":"LISTO"}')
    echo "[DEBUG] Response: $RESP2"
    sleep 1

    echo "[DEBUG] LISTO -> ENTREGADO"
    RESP3=$(curl -s -X PATCH "$API_URL/pedidos/$PEDIDO_ID/estado" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN" \
        -d '{"estado":"ENTREGADO"}')
    echo "[DEBUG] Response: $RESP3"
    sleep 1

    echo "[SUCCESS] Pedido is now ENTREGADO"
    echo
}

# Function to cleanup (delete test data)
cleanup() {
    echo
    echo "[INFO] Cleaning up test data..."
    if [ ! -z "$MESA_ID" ]; then
        curl -s -X DELETE "$API_URL/mesas/$MESA_ID" \
            -H "Authorization: Bearer $TOKEN" > /dev/null 2>&1 || true
    fi
    if [ ! -z "$PRODUCTO_ID" ]; then
        curl -s -X DELETE "$API_URL/productos/$PRODUCTO_ID" \
            -H "Authorization: Bearer $TOKEN" > /dev/null 2>&1 || true
    fi
    echo "[INFO] Cleanup complete"
}

trap cleanup EXIT

# Login
login

# Setup test data
create_mesa
create_producto

echo
echo "=============================================="
echo "TEST CASE: Create 2 pedidos with DIFFERENT fiscal data"
echo "=============================================="
echo

# Create first pedido
echo "[STEP 1/4] Creating Pedido #1..."
create_pedido_entregado
PEDIDO_1_ID=$PEDIDO_ID
echo "[INFO] Pedido #1 ID: $PEDIDO_1_ID"
echo

# Create second pedido
echo "[STEP 2/4] Creating Pedido #2..."
create_pedido_entregado
PEDIDO_2_ID=$PEDIDO_ID
echo "[INFO] Pedido #2 ID: $PEDIDO_2_ID"
echo

# Generate factura for Pedido #1 with CONSUMIDOR FINAL
echo "[STEP 3/4] Generating factura for Pedido #1 (Consumidor Final)..."
RESPONSE_1=$(curl -s -X POST "$API_URL/facturas" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{
        \"pedidoId\":$PEDIDO_1_ID,
        \"esConsumidorFinal\":true
    }")

FACTURA_1_ID=$(echo "$RESPONSE_1" | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')

if [ -z "$FACTURA_1_ID" ]; then
    echo "[ERROR] Failed to create factura 1. Response: $RESPONSE_1"
    exit 1
fi

echo "[SUCCESS] Factura #1 created with ID: $FACTURA_1_ID"

# Verify Factura #1 snapshot
FACTURA_1=$(curl -s -X GET "$API_URL/facturas/$FACTURA_1_ID" \
    -H "Authorization: Bearer $TOKEN")

CLIENTE_NOMBRE_1=$(echo "$FACTURA_1" | grep -o '"clienteNombre":"[^"]*"' | sed 's/"clienteNombre":"\([^"]*\)"/\1/')
CLIENTE_ID_FISCAL_1=$(echo "$FACTURA_1" | grep -o '"clienteIdentificacionFiscal":"[^"]*"' | sed 's/"clienteIdentificacionFiscal":"\([^"]*\)"/\1/')

echo "[VERIFY] Factura #1 - Nombre: $CLIENTE_NOMBRE_1, Identificación: $CLIENTE_ID_FISCAL_1"

if [ "$CLIENTE_NOMBRE_1" = "Consumidor Final" ] && [ "$CLIENTE_ID_FISCAL_1" = "CONSUMIDOR FINAL" ]; then
    echo "[SUCCESS] ✓ Factura #1 snapshot is correct (Consumidor Final)"
else
    echo "[ERROR] ✗ Factura #1 snapshot is incorrect"
    exit 1
fi
echo

# Generate factura for Pedido #2 with NOMINATIVE data (different from Pedido #1)
echo "[STEP 4/4] Generating factura for Pedido #2 (Nominative - Maria Garcia)..."
RESPONSE_2=$(curl -s -X POST "$API_URL/facturas" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{
        \"pedidoId\":$PEDIDO_2_ID,
        \"esConsumidorFinal\":false,
        \"clienteIdentificacionFiscal\":\"1122334455\",
        \"clienteNombre\":\"Maria Garcia\",
        \"clienteDireccion\":\"Avenida Central 456\",
        \"clienteEmail\":\"maria@example.com\",
        \"clienteTelefono\":\"555-7777\",
        \"guardarCliente\":false
    }")

FACTURA_2_ID=$(echo "$RESPONSE_2" | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')

if [ -z "$FACTURA_2_ID" ]; then
    echo "[ERROR] Failed to create factura 2. Response: $RESPONSE_2"
    exit 1
fi

echo "[SUCCESS] Factura #2 created with ID: $FACTURA_2_ID"

# Verify Factura #2 snapshot
FACTURA_2=$(curl -s -X GET "$API_URL/facturas/$FACTURA_2_ID" \
    -H "Authorization: Bearer $TOKEN")

CLIENTE_NOMBRE_2=$(echo "$FACTURA_2" | grep -o '"clienteNombre":"[^"]*"' | sed 's/"clienteNombre":"\([^"]*\)"/\1/')
CLIENTE_ID_FISCAL_2=$(echo "$FACTURA_2" | grep -o '"clienteIdentificacionFiscal":"[^"]*"' | sed 's/"clienteIdentificacionFiscal":"\([^"]*\)"/\1/')
CLIENTE_DIRECCION_2=$(echo "$FACTURA_2" | grep -o '"clienteDireccion":"[^"]*"' | sed 's/"clienteDireccion":"\([^"]*\)"/\1/')

echo "[VERIFY] Factura #2 - Nombre: $CLIENTE_NOMBRE_2, Identificación: $CLIENTE_ID_FISCAL_2, Dirección: $CLIENTE_DIRECCION_2"

if [ "$CLIENTE_NOMBRE_2" = "Maria Garcia" ] && [ "$CLIENTE_ID_FISCAL_2" = "1122334455" ] && [ "$CLIENTE_DIRECCION_2" = "Avenida Central 456" ]; then
    echo "[SUCCESS] ✓ Factura #2 snapshot is correct (Maria Garcia nominative data)"
else
    echo "[ERROR] ✗ Factura #2 snapshot is incorrect"
    exit 1
fi
echo

echo "=============================================="
echo "VERIFICATION: State Isolation"
echo "=============================================="
echo
echo "[VERIFY] Factura #1 (Pedido $PEDIDO_1_ID): $CLIENTE_NOMBRE_1"
echo "[VERIFY] Factura #2 (Pedido $PEDIDO_2_ID): $CLIENTE_NOMBRE_2"
echo

if [ "$CLIENTE_NOMBRE_1" != "$CLIENTE_NOMBRE_2" ]; then
    echo "[SUCCESS] ✓ STATE ISOLATION VERIFIED: Each pedido has independent fiscal data"
else
    echo "[ERROR] ✗ STATE ISOLATION FAILED: Fiscal data leaked between pedidos"
    exit 1
fi

echo
echo "=============================================="
echo "ALL TESTS PASSED ✓"
echo "=============================================="
echo
echo "Summary:"
echo "- Pedido #$PEDIDO_1_ID → Factura #$FACTURA_1_ID: Consumidor Final"
echo "- Pedido #$PEDIDO_2_ID → Factura #$FACTURA_2_ID: Maria Garcia (1122334455)"
echo "- State isolation: VERIFIED ✓"
echo "- Snapshots: CORRECT ✓"
echo
echo "The backend correctly supports per-pedido fiscal data isolation."
echo "The new UI implementation at https://localhost/facturas leverages this behavior."
echo
