#!/bin/bash
set -e

API_URL="http://localhost:8080"

# Login
echo "=== Logging in ==="
TOKEN=$(curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@sailor.com","password":"admin123"}' | \
    grep -o '"accessToken":"[^"]*"' | sed 's/"accessToken":"\([^"]*\)"/\1/')

echo "Token obtained: ${TOKEN:0:20}..."

# Create mesa
echo -e "\n=== Creating mesa ==="
MESA=$(curl -s -X POST "$API_URL/mesas" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"codigo":"TEST-001","capacidad":4,"estado":"disponible"}')
MESA_ID=$(echo "$MESA" | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')
echo "Mesa ID: $MESA_ID"

# Create producto
echo -e "\n=== Creating producto ==="
PRODUCTO=$(curl -s -X POST "$API_URL/productos" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"nombre":"Test Burger","precio":15.00,"categoria":"PLATO_PRINCIPAL","disponible":true}')
PRODUCTO_ID=$(echo "$PRODUCTO" | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')
echo "Producto ID: $PRODUCTO_ID"

# Create and transition pedido
echo -e "\n=== Creating pedido ==="
PEDIDO=$(curl -s -X POST "$API_URL/pedidos" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"mesaId\":$MESA_ID,\"items\":[{\"productoId\":$PRODUCTO_ID,\"cantidad\":1}]}")
PEDIDO_ID=$(echo "$PEDIDO" | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')
echo "Pedido ID: $PEDIDO_ID"

echo "Transitioning to PREPARACION..."
curl -s -X PATCH "$API_URL/pedidos/$PEDIDO_ID/estado" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"nuevoEstado":"PREPARACION"}' | head -c 100
echo

sleep 1

echo "Transitioning to LISTO..."
curl -s -X PATCH "$API_URL/pedidos/$PEDIDO_ID/estado" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"nuevoEstado":"LISTO"}' | head -c 100
echo

sleep 1

echo "Transitioning to ENTREGADO..."
curl -s -X PATCH "$API_URL/pedidos/$PEDIDO_ID/estado" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"nuevoEstado":"ENTREGADO"}' | head -c 100
echo

sleep 2

# Verify pedido estado
echo -e "\n=== Verifying pedido estado ==="
PEDIDO_CHECK=$(curl -s -X GET "$API_URL/pedidos/$PEDIDO_ID" \
    -H "Authorization: Bearer $TOKEN")
echo "Pedido estado: $(echo "$PEDIDO_CHECK" | grep -o '"estado":"[^"]*"' | sed 's/"estado":"\([^"]*\)"/\1/')"

# Test 1: Consumidor Final
echo -e "\n=== TEST 1: Creating factura - Consumidor Final ==="
FACTURA1=$(curl -s -X POST "$API_URL/facturas" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"pedidoId\":$PEDIDO_ID,\"esConsumidorFinal\":true}")

echo "Factura response:"
echo "$FACTURA1" | head -c 500
echo

FACTURA1_ID=$(echo "$FACTURA1" | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')
if [ ! -z "$FACTURA1_ID" ]; then
    echo "✓ SUCCESS: Factura $FACTURA1_ID created"
    NOMBRE=$(echo "$FACTURA1" | grep -o '"clienteNombre":"[^"]*"' | sed 's/"clienteNombre":"\([^"]*\)"/\1/')
    ID_FISCAL=$(echo "$FACTURA1" | grep -o '"clienteIdentificacionFiscal":"[^"]*"' | sed 's/"clienteIdentificacionFiscal":"\([^"]*\)"/\1/')
    echo "  Cliente Nombre: $NOMBRE"
    echo "  Cliente Identificacion: $ID_FISCAL"
else
    echo "✗ FAILED: Could not create factura"
fi

echo -e "\n=== Test completed ==="
