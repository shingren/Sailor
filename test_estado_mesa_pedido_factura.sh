#!/bin/bash

# Test script para validar el ciclo completo de estado de mesa:
# DISPONIBLE → OCUPADA (al crear pedido) → DISPONIBLE (al pagar factura)

set -e

echo "========================================="
echo "TEST: Ciclo de Estado de Mesa"
echo "========================================="
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

API_BASE="https://localhost/api"
TOKEN=""

# Login as admin
echo "[1/10] Login as admin@sailor.com..."
LOGIN_RESPONSE=$(curl -k -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sailor.com","password":"admin123"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
echo -e "${GREEN}✓ Logged in as admin@sailor.com${NC}"
echo ""

# Get or create a producto
echo "[2/10] Creating producto if needed..."
PRODUCTOS=$(curl -k -s -X GET "$API_BASE/productos" -H "Authorization: Bearer $TOKEN")
PRODUCTO_ID=$(echo $PRODUCTOS | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -z "$PRODUCTO_ID" ]; then
  PRODUCTO_RESPONSE=$(curl -k -s -X POST "$API_BASE/productos" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"nombre":"Pizza Margherita","precio":12000,"categoria":"PLATO_PRINCIPAL"}')
  PRODUCTO_ID=$(echo $PRODUCTO_RESPONSE | grep -o '"id":[0-9]*' | cut -d':' -f2)
fi
echo -e "${GREEN}✓ Producto ID: $PRODUCTO_ID${NC}"
echo ""

# Get or create a mesa DISPONIBLE
echo "[3/10] Creating mesa if needed..."
MESAS=$(curl -k -s -X GET "$API_BASE/mesas" -H "Authorization: Bearer $TOKEN")
MESA_ID=$(echo $MESAS | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -z "$MESA_ID" ]; then
  MESA_RESPONSE=$(curl -k -s -X POST "$API_BASE/mesas" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"codigo":"M1","capacidad":4,"estado":"disponible"}')
  MESA_ID=$(echo $MESA_RESPONSE | grep -o '"id":[0-9]*' | cut -d':' -f2)
fi

# Ensure mesa is DISPONIBLE before test
curl -k -s -X PUT "$API_BASE/mesas/$MESA_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"codigo":"M1","capacidad":4,"estado":"disponible"}' > /dev/null

MESA_RESPONSE=$(curl -k -s -X GET "$API_BASE/mesas" -H "Authorization: Bearer $TOKEN")
MESA_DATA=$(echo $MESA_RESPONSE | grep -o "{[^}]*\"id\":$MESA_ID[^}]*}" | head -1)
MESA_ESTADO=$(echo $MESA_DATA | grep -o '"estado":"[^"]*"' | cut -d'"' -f4)

echo -e "${GREEN}✓ Mesa ID: $MESA_ID, Estado inicial: $MESA_ESTADO${NC}"
echo ""

# TEST 1: Crear pedido y verificar que mesa pasa a OCUPADA
echo "[4/10] TEST 1: Creating pedido and validating mesa becomes OCUPADA..."
PEDIDO_RESPONSE=$(curl -k -s -X POST "$API_BASE/pedidos" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"mesaId\":$MESA_ID,\"items\":[{\"productoId\":$PRODUCTO_ID,\"cantidad\":1}]}")

PEDIDO_ID=$(echo $PEDIDO_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo -e "${GREEN}✓ Pedido #$PEDIDO_ID created${NC}"
echo ""

# Verificar estado de mesa después de crear pedido
echo "[5/10] Validating mesa estado after creating pedido..."
MESA_RESPONSE=$(curl -k -s -X GET "$API_BASE/mesas" -H "Authorization: Bearer $TOKEN")
MESA_ESTADO_AFTER_PEDIDO=$(echo $MESA_RESPONSE | grep -o "\"id\":$MESA_ID[^}]*\"estado\":\"[^\"]*\"" | grep -o '"estado":"[^"]*"' | cut -d'"' -f4)

echo "Mesa estado after pedido creation: $MESA_ESTADO_AFTER_PEDIDO"

FAIL=0

if [ "$MESA_ESTADO_AFTER_PEDIDO" != "ocupada" ]; then
  echo -e "${RED}✗ FALLO: Mesa estado es '$MESA_ESTADO_AFTER_PEDIDO', se esperaba 'ocupada'${NC}"
  FAIL=1
else
  echo -e "${GREEN}✓ Mesa pasó a ocupada correctamente${NC}"
fi
echo ""

# Move pedido to ENTREGADO
echo "[6/10] Moving pedido to ENTREGADO..."
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

# Verificar que mesa sigue OCUPADA
echo "[7/10] Validating mesa remains OCUPADA after ENTREGADO..."
MESA_RESPONSE=$(curl -k -s -X GET "$API_BASE/mesas" -H "Authorization: Bearer $TOKEN")
MESA_DATA=$(echo $MESA_RESPONSE | grep -o "{[^}]*\"id\":$MESA_ID[^}]*}" | head -1)
MESA_ESTADO_AFTER_ENTREGADO=$(echo $MESA_DATA | grep -o '"estado":"[^"]*"' | cut -d'"' -f4)

echo "Mesa estado after ENTREGADO: $MESA_ESTADO_AFTER_ENTREGADO"

if [ "$MESA_ESTADO_AFTER_ENTREGADO" != "ocupada" ]; then
  echo -e "${YELLOW}⚠ WARNING: Mesa estado cambió a '$MESA_ESTADO_AFTER_ENTREGADO', se esperaba 'ocupada'${NC}"
else
  echo -e "${GREEN}✓ Mesa sigue ocupada (correcto)${NC}"
fi
echo ""

# Create factura
echo "[8/10] Creating factura..."
FACTURA_RESPONSE=$(curl -k -s -X POST "$API_BASE/facturas" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"pedidoId\":$PEDIDO_ID}")

FACTURA_ID=$(echo $FACTURA_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
FACTURA_TOTAL=$(echo $FACTURA_RESPONSE | grep -o '"total":[0-9.]*' | cut -d':' -f2)
echo -e "${GREEN}✓ Factura #$FACTURA_ID created (Total: $FACTURA_TOTAL)${NC}"
echo ""

# TEST 2: Pagar factura y verificar que mesa pasa a DISPONIBLE
echo "[9/10] TEST 2: Paying factura and validating mesa becomes DISPONIBLE..."
PAGO_RESPONSE=$(curl -k -s -X POST "$API_BASE/pagos" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"facturaId\":$FACTURA_ID,\"monto\":$FACTURA_TOTAL,\"metodo\":\"EFECTIVO\"}")

FACTURA_ESTADO=$(echo $PAGO_RESPONSE | grep -o '"estado":"[^"]*"' | head -1 | cut -d'"' -f4)
echo -e "${GREEN}✓ Pago registrado. Estado factura: $FACTURA_ESTADO${NC}"
echo ""

# Verificar estado de mesa después de pagar
echo "[10/10] TEST 2: Validating mesa estado after payment..."
MESA_RESPONSE=$(curl -k -s -X GET "$API_BASE/mesas" -H "Authorization: Bearer $TOKEN")
MESA_DATA=$(echo $MESA_RESPONSE | grep -o "{[^}]*\"id\":$MESA_ID[^}]*}" | head -1)
MESA_ESTADO_AFTER_PAGO=$(echo $MESA_DATA | grep -o '"estado":"[^"]*"' | cut -d'"' -f4)

echo "Mesa estado after payment: $MESA_ESTADO_AFTER_PAGO"

if [ "$MESA_ESTADO_AFTER_PAGO" != "disponible" ]; then
  echo -e "${RED}✗ FALLO: Mesa estado es '$MESA_ESTADO_AFTER_PAGO', se esperaba 'disponible'${NC}"
  FAIL=1
else
  echo -e "${GREEN}✓ Mesa pasó a disponible correctamente${NC}"
fi
echo ""

# Verificar estado de pedido
PEDIDO_CHECK=$(curl -k -s -X GET "$API_BASE/pedidos/$PEDIDO_ID" -H "Authorization: Bearer $TOKEN")
PEDIDO_ESTADO=$(echo $PEDIDO_CHECK | grep -o '"estado":"[^"]*"' | head -1 | cut -d'"' -f4)

echo "Pedido estado final: $PEDIDO_ESTADO"

if [ "$PEDIDO_ESTADO" != "PAGADO" ]; then
  echo -e "${RED}✗ FALLO: Pedido estado es '$PEDIDO_ESTADO', se esperaba 'PAGADO'${NC}"
  FAIL=1
else
  echo -e "${GREEN}✓ Pedido marcado como PAGADO correctamente${NC}"
fi
echo ""

if [ "$FAIL" -eq 1 ]; then
  echo "========================================="
  echo -e "${RED}✗ TEST FAILED${NC}"
  echo "========================================="
  echo ""
  echo "El ciclo de estado de mesa NO está funcionando correctamente."
  echo "Verifica que:"
  echo "  - PedidoService marca mesa como OCUPADA al crear pedido"
  echo "  - FacturaService libera mesa (DISPONIBLE) al pagar completamente"
  echo ""
  exit 1
fi

echo "========================================="
echo -e "${GREEN}✓ TEST PASSED${NC}"
echo "========================================="
echo ""
echo "Summary:"
echo "  ✓ Mesa DISPONIBLE → OCUPADA al crear pedido"
echo "  ✓ Mesa OCUPADA → DISPONIBLE al pagar factura"
echo "  ✓ Pedido → PAGADO al pagar factura"
echo ""
echo "✓ Ciclo completo de estado de mesa funcionando correctamente!"
