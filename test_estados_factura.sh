#!/bin/bash

# Test script para validar estados de Factura (PENDIENTE/PAGADA) y Pedido (PAGADO)

set -e

echo "========================================="
echo "VALIDACIÓN: Estados PENDIENTE/PAGADA"
echo "========================================="
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

API_BASE="https://localhost/api"
TOKEN=""

# Step 1: Login
echo "[1/6] Login..."
LOGIN_RESPONSE=$(curl -k -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sailor.com","password":"admin123"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
echo -e "${GREEN}✓ Logged in${NC}"
echo ""

# Step 2: Get mesa/producto
echo "[2/6] Getting mesa and producto IDs..."
MESAS=$(curl -k -s -X GET "$API_BASE/mesas" -H "Authorization: Bearer $TOKEN")
MESA_ID=$(echo $MESAS | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

PRODUCTOS=$(curl -k -s -X GET "$API_BASE/productos" -H "Authorization: Bearer $TOKEN")
PRODUCTO_ID=$(echo $PRODUCTOS | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

echo -e "${GREEN}✓ Mesa ID: $MESA_ID, Producto ID: $PRODUCTO_ID${NC}"
echo ""

# Step 3: Create pedido and move to ENTREGADO
echo "[3/6] Creating pedido and moving to ENTREGADO..."
PEDIDO_RESPONSE=$(curl -k -s -X POST "$API_BASE/pedidos" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"mesaId\":$MESA_ID,\"items\":[{\"productoId\":$PRODUCTO_ID,\"cantidad\":2}]}")

PEDIDO_ID=$(echo $PEDIDO_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

# State transitions
curl -k -s -X PATCH "$API_BASE/pedidos/$PEDIDO_ID/estado" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"estado":"PREPARACION"}' > /dev/null

curl -k -s -X PATCH "$API_BASE/pedidos/$PEDIDO_ID/estado" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"estado":"LISTO"}' > /dev/null

curl -k -s -X PATCH "$API_BASE/pedidos/$PEDIDO_ID/estado" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"estado":"ENTREGADO"}' > /dev/null

echo -e "${GREEN}✓ Pedido #$PEDIDO_ID created and set to ENTREGADO${NC}"
echo ""

# Step 4: Create factura (should be PENDIENTE initially)
echo "[4/6] Creating factura (should be PENDIENTE)..."
FACTURA_RESPONSE=$(curl -k -s -X POST "$API_BASE/facturas" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"pedidoId\":$PEDIDO_ID}")

FACTURA_ID=$(echo $FACTURA_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
FACTURA_ESTADO=$(echo $FACTURA_RESPONSE | grep -o '"estado":"[^"]*"' | cut -d'"' -f4)
FACTURA_TOTAL=$(echo $FACTURA_RESPONSE | grep -o '"total":[0-9.]*' | cut -d':' -f2)

if [ "$FACTURA_ESTADO" != "PENDIENTE" ]; then
  echo -e "${RED}✗ Error: Factura estado is '$FACTURA_ESTADO', expected 'PENDIENTE'${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Factura #$FACTURA_ID created with estado: $FACTURA_ESTADO (Total: \$$FACTURA_TOTAL)${NC}"
echo ""

# Step 5: Register full payment
echo "[5/6] Registering full payment (should change to PAGADA)..."
PAGO_RESPONSE=$(curl -k -s -X POST "$API_BASE/pagos" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"facturaId\":$FACTURA_ID,\"monto\":$FACTURA_TOTAL,\"metodo\":\"EFECTIVO\"}")

FACTURA_ESTADO_AFTER=$(echo $PAGO_RESPONSE | grep -o '"estado":"[^"]*"' | cut -d'"' -f4)

if [ "$FACTURA_ESTADO_AFTER" != "PAGADA" ]; then
  echo -e "${RED}✗ Error: After payment, Factura estado is '$FACTURA_ESTADO_AFTER', expected 'PAGADA'${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Payment registered. Factura estado changed to: $FACTURA_ESTADO_AFTER${NC}"
echo ""

# Step 6: Verify Pedido estado is now PAGADO
echo "[6/6] Verifying Pedido estado is PAGADO..."
PEDIDO_CHECK=$(curl -k -s -X GET "$API_BASE/pedidos/$PEDIDO_ID" -H "Authorization: Bearer $TOKEN")
PEDIDO_ESTADO=$(echo $PEDIDO_CHECK | grep -o '"estado":"[^"]*"' | cut -d'"' -f4)

if [ "$PEDIDO_ESTADO" != "PAGADO" ]; then
  echo -e "${RED}✗ Error: Pedido estado is '$PEDIDO_ESTADO', expected 'PAGADO'${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Pedido #$PEDIDO_ID estado is: $PEDIDO_ESTADO${NC}"
echo ""

echo "========================================="
echo -e "${GREEN}✓ ALL TESTS PASSED${NC}"
echo "========================================="
echo ""
echo "Summary:"
echo "  - Pedido #$PEDIDO_ID: PENDIENTE → PREPARACION → LISTO → ENTREGADO → PAGADO"
echo "  - Factura #$FACTURA_ID: PENDIENTE → PAGADA"
echo "  - Payment: \$$FACTURA_TOTAL (EFECTIVO)"
echo ""
echo "✓ Estados canónicos validados correctamente!"
echo "  - Factura: PENDIENTE, PAGADA"
echo "  - Pedido: PENDIENTE, PREPARACION, LISTO, ENTREGADO, PAGADO"
