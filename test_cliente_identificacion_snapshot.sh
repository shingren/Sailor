#!/bin/bash

# Test script for Cliente Identificacion and Snapshot functionality
# This script tests:
# - Caso A: Consumidor final factura
# - Caso B: Nominative factura without saving cliente
# - Caso C: Nominative factura with guardarCliente=true, then edit cliente and verify snapshot unchanged

set -e

API_URL="http://localhost:8080"
ADMIN_USER="admin@sailor.com"
ADMIN_PASS="admin123"

echo "========================================="
echo "TEST: Cliente Identificacion y Snapshot"
echo "========================================="
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
        -d '{"codigo":"TEST-MESA","capacidad":4,"estado":"disponible"}')

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
        -d '{"nombre":"Hamburguesa Test","descripcion":"Test product","precio":10.50,"categoria":"PLATO_PRINCIPAL","disponible":true}')

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
    curl -s -X PATCH "$API_URL/pedidos/$PEDIDO_ID/estado" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN" \
        -d '{"nuevoEstado":"PREPARACION"}' > /dev/null

    curl -s -X PATCH "$API_URL/pedidos/$PEDIDO_ID/estado" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN" \
        -d '{"nuevoEstado":"LISTO"}' > /dev/null

    curl -s -X PATCH "$API_URL/pedidos/$PEDIDO_ID/estado" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN" \
        -d '{"nuevoEstado":"ENTREGADO"}' > /dev/null

    echo "[SUCCESS] Pedido is now ENTREGADO"
    echo
}

# Function to cleanup (delete test data)
cleanup() {
    echo
    echo "[INFO] Cleaning up test data..."
    # Note: CASCADE deletes should handle cleanup
    if [ ! -z "$MESA_ID" ]; then
        curl -s -X DELETE "$API_URL/mesas/$MESA_ID" \
            -H "Authorization: Bearer $TOKEN" > /dev/null 2>&1 || true
    fi
    if [ ! -z "$PRODUCTO_ID" ]; then
        curl -s -X DELETE "$API_URL/productos/$PRODUCTO_ID" \
            -H "Authorization: Bearer $TOKEN" > /dev/null 2>&1 || true
    fi
    if [ ! -z "$CLIENTE_TEST_ID" ]; then
        curl -s -X DELETE "$API_URL/clientes/$CLIENTE_TEST_ID" \
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
echo "========================================="
echo "CASO A: Consumidor Final"
echo "========================================="
echo

create_pedido_entregado

echo "[TEST] Creating factura for consumidor final..."
RESPONSE=$(curl -s -X POST "$API_URL/facturas" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"pedidoId\":$PEDIDO_ID,\"esConsumidorFinal\":true}")

FACTURA_A_ID=$(echo "$RESPONSE" | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')

if [ -z "$FACTURA_A_ID" ]; then
    echo "[ERROR] Failed to create factura A. Response: $RESPONSE"
    exit 1
fi

echo "[SUCCESS] Factura A created with ID: $FACTURA_A_ID"

# Verify snapshot
FACTURA_A=$(curl -s -X GET "$API_URL/facturas/$FACTURA_A_ID" \
    -H "Authorization: Bearer $TOKEN")

CLIENTE_NOMBRE=$(echo "$FACTURA_A" | grep -o '"clienteNombre":"[^"]*"' | sed 's/"clienteNombre":"\([^"]*\)"/\1/')
CLIENTE_ID_FISCAL=$(echo "$FACTURA_A" | grep -o '"clienteIdentificacionFiscal":"[^"]*"' | sed 's/"clienteIdentificacionFiscal":"\([^"]*\)"/\1/')

echo "[VERIFY] Cliente Nombre: $CLIENTE_NOMBRE"
echo "[VERIFY] Cliente Identificacion: $CLIENTE_ID_FISCAL"

if [ "$CLIENTE_NOMBRE" = "Consumidor Final" ] && [ "$CLIENTE_ID_FISCAL" = "CONSUMIDOR FINAL" ]; then
    echo "[SUCCESS] ✓ Caso A PASSED: Consumidor Final snapshot is correct"
else
    echo "[ERROR] ✗ Caso A FAILED: Expected 'Consumidor Final', got '$CLIENTE_NOMBRE' / '$CLIENTE_ID_FISCAL'"
    exit 1
fi

echo
echo "========================================="
echo "CASO B: Nominativa sin guardar cliente"
echo "========================================="
echo

create_pedido_entregado

echo "[TEST] Creating nominative factura WITHOUT saving cliente..."
RESPONSE=$(curl -s -X POST "$API_URL/facturas" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{
        \"pedidoId\":$PEDIDO_ID,
        \"esConsumidorFinal\":false,
        \"clienteIdentificacionFiscal\":\"1234567890\",
        \"clienteNombre\":\"Juan Pérez\",
        \"clienteDireccion\":\"Calle Falsa 123\",
        \"clienteEmail\":\"juan@example.com\",
        \"clienteTelefono\":\"555-1234\",
        \"guardarCliente\":false
    }")

FACTURA_B_ID=$(echo "$RESPONSE" | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')

if [ -z "$FACTURA_B_ID" ]; then
    echo "[ERROR] Failed to create factura B. Response: $RESPONSE"
    exit 1
fi

echo "[SUCCESS] Factura B created with ID: $FACTURA_B_ID"

# Verify snapshot
FACTURA_B=$(curl -s -X GET "$API_URL/facturas/$FACTURA_B_ID" \
    -H "Authorization: Bearer $TOKEN")

CLIENTE_NOMBRE_B=$(echo "$FACTURA_B" | grep -o '"clienteNombre":"[^"]*"' | sed 's/"clienteNombre":"\([^"]*\)"/\1/')
CLIENTE_ID_FISCAL_B=$(echo "$FACTURA_B" | grep -o '"clienteIdentificacionFiscal":"[^"]*"' | sed 's/"clienteIdentificacionFiscal":"\([^"]*\)"/\1/')

echo "[VERIFY] Cliente Nombre: $CLIENTE_NOMBRE_B"
echo "[VERIFY] Cliente Identificacion: $CLIENTE_ID_FISCAL_B"

# Verify cliente was NOT saved
CLIENTE_SEARCH=$(curl -s -X GET "$API_URL/clientes/buscar?identificacion=1234567890" \
    -H "Authorization: Bearer $TOKEN" \
    -w "\n%{http_code}")

HTTP_CODE=$(echo "$CLIENTE_SEARCH" | tail -1)

if [ "$HTTP_CODE" = "404" ]; then
    echo "[SUCCESS] ✓ Caso B PASSED: Cliente was NOT saved (404 response)"
else
    echo "[ERROR] ✗ Caso B FAILED: Cliente should not exist, but got HTTP $HTTP_CODE"
    exit 1
fi

if [ "$CLIENTE_NOMBRE_B" = "Juan Pérez" ] && [ "$CLIENTE_ID_FISCAL_B" = "1234567890" ]; then
    echo "[SUCCESS] ✓ Caso B PASSED: Snapshot data is correct even without saving cliente"
else
    echo "[ERROR] ✗ Caso B FAILED: Snapshot mismatch"
    exit 1
fi

echo
echo "========================================="
echo "CASO C: Nominativa CON guardar cliente"
echo "========================================="
echo

create_pedido_entregado

echo "[TEST] Creating nominative factura WITH saving cliente..."
RESPONSE=$(curl -s -X POST "$API_URL/facturas" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{
        \"pedidoId\":$PEDIDO_ID,
        \"esConsumidorFinal\":false,
        \"clienteIdentificacionFiscal\":\"0987654321\",
        \"clienteNombre\":\"María García\",
        \"clienteDireccion\":\"Av. Principal 456\",
        \"clienteEmail\":\"maria@example.com\",
        \"clienteTelefono\":\"555-5678\",
        \"guardarCliente\":true
    }")

FACTURA_C_ID=$(echo "$RESPONSE" | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')

if [ -z "$FACTURA_C_ID" ]; then
    echo "[ERROR] Failed to create factura C. Response: $RESPONSE"
    exit 1
fi

echo "[SUCCESS] Factura C created with ID: $FACTURA_C_ID"

# Verify cliente WAS saved
CLIENTE_C=$(curl -s -X GET "$API_URL/clientes/buscar?identificacion=0987654321" \
    -H "Authorization: Bearer $TOKEN")

CLIENTE_TEST_ID=$(echo "$CLIENTE_C" | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')

if [ -z "$CLIENTE_TEST_ID" ]; then
    echo "[ERROR] Cliente should have been saved but was not found"
    exit 1
fi

echo "[SUCCESS] Cliente was saved with ID: $CLIENTE_TEST_ID"

# Get original snapshot
FACTURA_C_BEFORE=$(curl -s -X GET "$API_URL/facturas/$FACTURA_C_ID" \
    -H "Authorization: Bearer $TOKEN")

SNAPSHOT_NOMBRE_BEFORE=$(echo "$FACTURA_C_BEFORE" | grep -o '"clienteNombre":"[^"]*"' | sed 's/"clienteNombre":"\([^"]*\)"/\1/')
SNAPSHOT_DIRECCION_BEFORE=$(echo "$FACTURA_C_BEFORE" | grep -o '"clienteDireccion":"[^"]*"' | sed 's/"clienteDireccion":"\([^"]*\)"/\1/')

echo "[INFO] Original snapshot - Nombre: $SNAPSHOT_NOMBRE_BEFORE, Direccion: $SNAPSHOT_DIRECCION_BEFORE"

# Now update the cliente
echo "[TEST] Updating cliente to change nombre and direccion..."
curl -s -X PUT "$API_URL/clientes/$CLIENTE_TEST_ID" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
        "nombre":"María García EDITADA",
        "identificacionFiscal":"0987654321",
        "direccion":"Nueva Dirección 999",
        "email":"maria_nueva@example.com",
        "telefono":"555-9999"
    }' > /dev/null

echo "[SUCCESS] Cliente updated"

# Verify snapshot is UNCHANGED
FACTURA_C_AFTER=$(curl -s -X GET "$API_URL/facturas/$FACTURA_C_ID" \
    -H "Authorization: Bearer $TOKEN")

SNAPSHOT_NOMBRE_AFTER=$(echo "$FACTURA_C_AFTER" | grep -o '"clienteNombre":"[^"]*"' | sed 's/"clienteNombre":"\([^"]*\)"/\1/')
SNAPSHOT_DIRECCION_AFTER=$(echo "$FACTURA_C_AFTER" | grep -o '"clienteDireccion":"[^"]*"' | sed 's/"clienteDireccion":"\([^"]*\)"/\1/')

echo "[VERIFY] Snapshot after edit - Nombre: $SNAPSHOT_NOMBRE_AFTER, Direccion: $SNAPSHOT_DIRECCION_AFTER"

if [ "$SNAPSHOT_NOMBRE_BEFORE" = "$SNAPSHOT_NOMBRE_AFTER" ] && [ "$SNAPSHOT_DIRECCION_BEFORE" = "$SNAPSHOT_DIRECCION_AFTER" ]; then
    echo "[SUCCESS] ✓ Caso C PASSED: Snapshot is IMMUTABLE (unchanged after cliente edit)"
else
    echo "[ERROR] ✗ Caso C FAILED: Snapshot changed after cliente edit!"
    echo "  Before: $SNAPSHOT_NOMBRE_BEFORE / $SNAPSHOT_DIRECCION_BEFORE"
    echo "  After:  $SNAPSHOT_NOMBRE_AFTER / $SNAPSHOT_DIRECCION_AFTER"
    exit 1
fi

if [ "$SNAPSHOT_NOMBRE_AFTER" = "María García" ] && [ "$SNAPSHOT_DIRECCION_AFTER" = "Av. Principal 456" ]; then
    echo "[SUCCESS] ✓ Caso C PASSED: Snapshot retains original data"
else
    echo "[ERROR] ✗ Caso C FAILED: Snapshot data is incorrect"
    exit 1
fi

echo
echo "========================================="
echo "ALL TESTS PASSED ✓"
echo "========================================="
echo
echo "Summary:"
echo "- Caso A: Consumidor Final snapshot works correctly"
echo "- Caso B: Nominative factura without saving cliente works correctly"
echo "- Caso C: Snapshot is immutable (unchanged after cliente edit)"
echo
