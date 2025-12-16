#!/bin/bash

# Test script para validar reglas de negocio de pagos

set -e

echo "========================================="
echo "TEST: Validaciones duras de pagos"
echo "========================================="
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

API_BASE="https://localhost/api"
TOKEN=""

# Login
echo "[1/8] Login..."
LOGIN_RESPONSE=$(curl -k -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sailor.com","password":"admin123"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
echo -e "${GREEN}✓ Logged in${NC}"
echo ""

# Get mesa/producto
echo "[2/8] Getting mesa and producto..."
MESAS=$(curl -k -s -X GET "$API_BASE/mesas" -H "Authorization: Bearer $TOKEN")
MESA_ID=$(echo $MESAS | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

PRODUCTOS=$(curl -k -s -X GET "$API_BASE/productos" -H "Authorization: Bearer $TOKEN")
PRODUCTO_ID=$(echo $PRODUCTOS | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

echo -e "${GREEN}✓ Mesa ID: $MESA_ID, Producto ID: $PRODUCTO_ID${NC}"
echo ""

# Create pedido
echo "[3/8] Creating test pedido..."
PEDIDO_RESPONSE=$(curl -k -s -X POST "$API_BASE/pedidos" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"mesaId\":$MESA_ID,\"items\":[{\"productoId\":$PRODUCTO_ID,\"cantidad\":1}]}")

PEDIDO_ID=$(echo $PEDIDO_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo -e "${GREEN}✓ Pedido #$PEDIDO_ID created${NC}"
echo ""

# Move pedido to ENTREGADO
echo "[4/8] Moving pedido to ENTREGADO..."
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

echo -e "${GREEN}✓ Pedido estado: ENTREGADO${NC}"
echo ""

# Create factura
echo "[5/8] Creating factura..."
FACTURA_RESPONSE=$(curl -k -s -X POST "$API_BASE/facturas" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"pedidoId\":$PEDIDO_ID}")

FACTURA_ID=$(echo $FACTURA_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
FACTURA_TOTAL=$(echo $FACTURA_RESPONSE | grep -o '"total":[0-9.]*' | cut -d':' -f2)
echo -e "${GREEN}✓ Factura #$FACTURA_ID created (Total: \$$FACTURA_TOTAL)${NC}"
echo ""

# TEST CASE 1: Intentar pagar con monto > saldo pendiente (debe fallar con 400)
echo "[6/8] TEST CASE 1: Intentar pago con monto > saldo pendiente (should FAIL)..."
MONTO_EXCESIVO=99999
echo "  Factura total: \$$FACTURA_TOTAL"
echo "  Intentando pagar: \$$MONTO_EXCESIVO (monto excesivo)"

PAGO_EXCESO_RESPONSE=$(curl -k -s -w "\n%{http_code}" -X POST "$API_BASE/pagos" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"facturaId\":$FACTURA_ID,\"monto\":$MONTO_EXCESIVO,\"metodo\":\"EFECTIVO\"}")

HTTP_CODE_EXCESO=$(echo "$PAGO_EXCESO_RESPONSE" | tail -1)
BODY_EXCESO=$(echo "$PAGO_EXCESO_RESPONSE" | head -n -1)

if [ "$HTTP_CODE_EXCESO" -eq 400 ]; then
  ERROR_MSG=$(echo $BODY_EXCESO | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
  echo -e "${GREEN}✓ Correctly rejected with HTTP 400${NC}"
  echo -e "${GREEN}  Error: \"$ERROR_MSG\"${NC}"
else
  echo -e "${RED}✗ Expected HTTP 400 but got $HTTP_CODE_EXCESO${NC}"
  echo "  Response: $BODY_EXCESO"
  exit 1
fi
echo ""

# TEST CASE 2: Pago exacto del saldo (debe funcionar)
echo "[7/8] TEST CASE 2: Pago exacto del saldo pendiente (should SUCCEED)..."
echo "  Pagando monto exacto: \$$FACTURA_TOTAL"

PAGO_EXACTO_RESPONSE=$(curl -k -s -w "\n%{http_code}" -X POST "$API_BASE/pagos" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"facturaId\":$FACTURA_ID,\"monto\":$FACTURA_TOTAL,\"metodo\":\"EFECTIVO\"}")

HTTP_CODE_EXACTO=$(echo "$PAGO_EXACTO_RESPONSE" | tail -1)
BODY_EXACTO=$(echo "$PAGO_EXACTO_RESPONSE" | head -n -1)

if [ "$HTTP_CODE_EXACTO" -eq 200 ] || [ "$HTTP_CODE_EXACTO" -eq 201 ]; then
  FACTURA_ESTADO=$(echo $BODY_EXACTO | grep -o '"estado":"[^"]*"' | cut -d'"' -f4)
  echo -e "${GREEN}✓ Pago registered successfully${NC}"
  echo -e "${GREEN}✓ Factura estado: $FACTURA_ESTADO${NC}"

  if [ "$FACTURA_ESTADO" != "PAGADA" ]; then
    echo -e "${RED}✗ Expected estado PAGADA but got $FACTURA_ESTADO${NC}"
    exit 1
  fi
else
  echo -e "${RED}✗ Expected HTTP 200/201 but got $HTTP_CODE_EXACTO${NC}"
  echo "  Response: $BODY_EXACTO"
  exit 1
fi
echo ""

# TEST CASE 3: Intentar pagar factura ya PAGADA (debe fallar con 400)
echo "[8/8] TEST CASE 3: Intentar pagar factura ya PAGADA (should FAIL)..."

PAGO_PAGADA_RESPONSE=$(curl -k -s -w "\n%{http_code}" -X POST "$API_BASE/pagos" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"facturaId\":$FACTURA_ID,\"monto\":10,\"metodo\":\"EFECTIVO\"}")

HTTP_CODE_PAGADA=$(echo "$PAGO_PAGADA_RESPONSE" | tail -1)
BODY_PAGADA=$(echo "$PAGO_PAGADA_RESPONSE" | head -n -1)

if [ "$HTTP_CODE_PAGADA" -eq 400 ]; then
  ERROR_MSG=$(echo $BODY_PAGADA | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
  echo -e "${GREEN}✓ Correctly rejected with HTTP 400${NC}"
  echo -e "${GREEN}  Error: \"$ERROR_MSG\"${NC}"
else
  echo -e "${RED}✗ Expected HTTP 400 but got $HTTP_CODE_PAGADA${NC}"
  echo "  Response: $BODY_PAGADA"
  exit 1
fi
echo ""

echo "========================================="
echo -e "${GREEN}✓ ALL TESTS PASSED${NC}"
echo "========================================="
echo ""
echo "Summary:"
echo "  ✓ Pago con monto > saldo pendiente rechazado (HTTP 400)"
echo "  ✓ Pago exacto del saldo aceptado y factura → PAGADA"
echo "  ✓ Pago a factura PAGADA rechazado (HTTP 400)"
echo ""
echo "✓ Validaciones duras de pagos correctamente implementadas!"
