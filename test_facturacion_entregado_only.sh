#!/bin/bash

# Test script para validar contrato de facturación: SOLO ENTREGADO puede facturarse

set -e

echo "========================================="
echo "TEST: Solo ENTREGADO puede facturarse"
echo "========================================="
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

API_BASE="https://localhost/api"
TOKEN=""

# Login
echo "[1/6] Login..."
LOGIN_RESPONSE=$(curl -k -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sailor.com","password":"admin123"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
echo -e "${GREEN}✓ Logged in${NC}"
echo ""

# Get mesa/producto
echo "[2/6] Getting mesa and producto..."
MESAS=$(curl -k -s -X GET "$API_BASE/mesas" -H "Authorization: Bearer $TOKEN")
MESA_ID=$(echo $MESAS | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

PRODUCTOS=$(curl -k -s -X GET "$API_BASE/productos" -H "Authorization: Bearer $TOKEN")
PRODUCTO_ID=$(echo $PRODUCTOS | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

echo -e "${GREEN}✓ Mesa ID: $MESA_ID, Producto ID: $PRODUCTO_ID${NC}"
echo ""

# Create pedido
echo "[3/6] Creating test pedido..."
PEDIDO_RESPONSE=$(curl -k -s -X POST "$API_BASE/pedidos" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"mesaId\":$MESA_ID,\"items\":[{\"productoId\":$PRODUCTO_ID,\"cantidad\":1}]}")

PEDIDO_ID=$(echo $PEDIDO_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo -e "${GREEN}✓ Pedido #$PEDIDO_ID created (estado: PENDIENTE)${NC}"
echo ""

# TEST CASE 1: Try to facturar in LISTO (should fail with 400)
echo "[4/6] TEST CASE 1: Moving to LISTO and attempting facturación (should FAIL)..."

# Move to PREPARACION
curl -k -s -X PATCH "$API_BASE/pedidos/$PEDIDO_ID/estado" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"estado":"PREPARACION"}' > /dev/null

# Move to LISTO
curl -k -s -X PATCH "$API_BASE/pedidos/$PEDIDO_ID/estado" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"estado":"LISTO"}' > /dev/null

echo "  Pedido now in LISTO. Attempting to create factura..."

FACTURA_LISTO_RESPONSE=$(curl -k -s -w "\n%{http_code}" -X POST "$API_BASE/facturas" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"pedidoId\":$PEDIDO_ID}")

HTTP_CODE_LISTO=$(echo "$FACTURA_LISTO_RESPONSE" | tail -1)
BODY_LISTO=$(echo "$FACTURA_LISTO_RESPONSE" | head -n -1)

if [ "$HTTP_CODE_LISTO" -eq 400 ]; then
  ERROR_MSG=$(echo $BODY_LISTO | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
  echo -e "${GREEN}✓ Correctly rejected with HTTP 400${NC}"
  echo -e "${GREEN}  Error: \"$ERROR_MSG\"${NC}"
else
  echo -e "${RED}✗ Expected HTTP 400 but got $HTTP_CODE_LISTO${NC}"
  echo "  Response: $BODY_LISTO"
  exit 1
fi
echo ""

# TEST CASE 2: Move to ENTREGADO and facturar (should succeed)
echo "[5/6] TEST CASE 2: Moving to ENTREGADO and attempting facturación (should SUCCEED)..."

curl -k -s -X PATCH "$API_BASE/pedidos/$PEDIDO_ID/estado" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"estado":"ENTREGADO"}' > /dev/null

echo "  Pedido now in ENTREGADO. Attempting to create factura..."

FACTURA_ENTREGADO_RESPONSE=$(curl -k -s -w "\n%{http_code}" -X POST "$API_BASE/facturas" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"pedidoId\":$PEDIDO_ID}")

HTTP_CODE_ENTREGADO=$(echo "$FACTURA_ENTREGADO_RESPONSE" | tail -1)
BODY_ENTREGADO=$(echo "$FACTURA_ENTREGADO_RESPONSE" | head -n -1)

if [ "$HTTP_CODE_ENTREGADO" -eq 200 ] || [ "$HTTP_CODE_ENTREGADO" -eq 201 ]; then
  FACTURA_ID=$(echo $BODY_ENTREGADO | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
  echo -e "${GREEN}✓ Factura created successfully (ID: $FACTURA_ID)${NC}"
else
  echo -e "${RED}✗ Expected HTTP 200/201 but got $HTTP_CODE_ENTREGADO${NC}"
  echo "  Response: $BODY_ENTREGADO"
  exit 1
fi
echo ""

# TEST CASE 3: Verify /pedidos/listos-facturar only shows ENTREGADO without factura
echo "[6/6] TEST CASE 3: Verifying /pedidos/listos-facturar..."

# Create another pedido in ENTREGADO without factura
PEDIDO2_RESPONSE=$(curl -k -s -X POST "$API_BASE/pedidos" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"mesaId\":$MESA_ID,\"items\":[{\"productoId\":$PRODUCTO_ID,\"cantidad\":1}]}")

PEDIDO2_ID=$(echo $PEDIDO2_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

# Move to ENTREGADO
curl -k -s -X PATCH "$API_BASE/pedidos/$PEDIDO2_ID/estado" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"estado":"PREPARACION"}' > /dev/null
curl -k -s -X PATCH "$API_BASE/pedidos/$PEDIDO2_ID/estado" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"estado":"LISTO"}' > /dev/null
curl -k -s -X PATCH "$API_BASE/pedidos/$PEDIDO2_ID/estado" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"estado":"ENTREGADO"}' > /dev/null

# Get listos para facturar
LISTOS=$(curl -k -s -X GET "$API_BASE/pedidos/listos-facturar" -H "Authorization: Bearer $TOKEN")

# Check that PEDIDO2_ID is in the list (it should be, no factura yet)
if echo "$LISTOS" | grep -q "\"id\":$PEDIDO2_ID"; then
  echo -e "${GREEN}✓ Pedido #$PEDIDO2_ID (ENTREGADO sin factura) appears in listos-facturar${NC}"
else
  echo -e "${RED}✗ Pedido #$PEDIDO2_ID should appear in listos-facturar${NC}"
  exit 1
fi

# Check that PEDIDO_ID is NOT in the list (it has factura)
if echo "$LISTOS" | grep -q "\"id\":$PEDIDO_ID"; then
  echo -e "${RED}✗ Pedido #$PEDIDO_ID (already has factura) should NOT appear in listos-facturar${NC}"
  exit 1
else
  echo -e "${GREEN}✓ Pedido #$PEDIDO_ID (con factura) does NOT appear in listos-facturar${NC}"
fi

echo ""
echo "========================================="
echo -e "${GREEN}✓ ALL TESTS PASSED${NC}"
echo "========================================="
echo ""
echo "Summary:"
echo "  ✓ Facturación de pedido LISTO rechazada con HTTP 400"
echo "  ✓ Facturación de pedido ENTREGADO aceptada correctamente"
echo "  ✓ /pedidos/listos-facturar solo muestra ENTREGADO sin factura"
echo ""
echo "✓ Contrato de facturación estrictamente aplicado!"
