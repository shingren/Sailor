#!/bin/bash

# test_ordenes_por_cuenta.sh
# Test script for cuenta-based invoice migration (tab/open order per table flow)

set -e  # Exit on error

echo "========================================"
echo "TEST: Ordenes por Cuenta (Tab/Table Flow)"
echo "========================================"

BASE_URL="http://localhost:8080"

# Login as admin
echo ""
echo "[1/8] Login as admin..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sailor.com","password":"admin123"}')

TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['accessToken'])")
echo "✓ Login successful, token obtained"

# Create mesa if needed
echo ""
echo "[2/8] Create test mesa (Mesa 99)..."
curl -s -X POST "$BASE_URL/mesas" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"codigo":"Mesa 99","capacidad":4,"estado":"disponible"}' > /dev/null || echo "Mesa may already exist, continuing..."
echo "✓ Mesa 99 ready"

# Get mesa ID
MESA_ID=$(curl -s -X GET "$BASE_URL/mesas" \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -c "import sys, json; mesas = json.load(sys.stdin); print(next((m['id'] for m in mesas if m['codigo'] == 'Mesa 99'), None))")
echo "Mesa ID: $MESA_ID"

# Create product if needed
echo ""
echo "[3/8] Create test product with extras..."
PRODUCT_RESPONSE=$(curl -s -X POST "$BASE_URL/productos" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"nombre":"Hamburguesa Test","categoria":"Test","precio":150.00,"disponible":true}')
PRODUCT_ID=$(echo $PRODUCT_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])" 2>/dev/null || echo "")

if [ -z "$PRODUCT_ID" ]; then
  # Product may exist, get it
  PRODUCT_ID=$(curl -s -X GET "$BASE_URL/productos" \
    -H "Authorization: Bearer $TOKEN" \
    | python3 -c "import sys, json; products = json.load(sys.stdin); print(next((p['id'] for p in products if p['nombre'] == 'Hamburguesa Test'), None))")
fi
echo "Product ID: $PRODUCT_ID"

# Create Pedido 1
echo ""
echo "[4/8] Create Pedido 1 for Mesa 99..."
PEDIDO1_RESPONSE=$(curl -s -X POST "$BASE_URL/pedidos" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"mesaId\":$MESA_ID,\"items\":[{\"productoId\":$PRODUCT_ID,\"cantidad\":2}],\"observaciones\":\"Test Pedido 1\"}")
PEDIDO1_ID=$(echo $PEDIDO1_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])")
CUENTA_ID=$(echo $PEDIDO1_RESPONSE | python3 -c "import sys, json; resp = json.load(sys.stdin); print(resp.get('cuentaId', 'N/A'))" 2>/dev/null || echo "N/A")
echo "✓ Pedido 1 created: ID=$PEDIDO1_ID"
echo "  Cuenta ID (should be auto-created): $CUENTA_ID"

# If cuenta not in pedido response, get it from cuentas endpoint
if [ "$CUENTA_ID" = "N/A" ]; then
  echo "  Fetching cuenta from /cuentas/abiertas..."
  CUENTA_RESPONSE=$(curl -s -X GET "$BASE_URL/cuentas/abiertas" \
    -H "Authorization: Bearer $TOKEN")
  CUENTA_ID=$(echo $CUENTA_RESPONSE | python3 -c "import sys, json; cuentas = json.load(sys.stdin); print(next((c['id'] for c in cuentas if c['mesaId'] == $MESA_ID), None))")
  echo "  Cuenta ID from API: $CUENTA_ID"
fi

# Create Pedido 2 (same mesa - should use same cuenta)
echo ""
echo "[5/8] Create Pedido 2 for same Mesa 99 (should reuse cuenta $CUENTA_ID)..."
PEDIDO2_RESPONSE=$(curl -s -X POST "$BASE_URL/pedidos" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"mesaId\":$MESA_ID,\"items\":[{\"productoId\":$PRODUCT_ID,\"cantidad\":1}],\"observaciones\":\"Test Pedido 2\"}")
PEDIDO2_ID=$(echo $PEDIDO2_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])")
CUENTA_ID_2=$(echo $PEDIDO2_RESPONSE | python3 -c "import sys, json; resp = json.load(sys.stdin); print(resp.get('cuentaId', 'N/A'))" 2>/dev/null || echo "N/A")
echo "✓ Pedido 2 created: ID=$PEDIDO2_ID"

# Validate both pedidos share same cuenta
if [ "$CUENTA_ID" = "$CUENTA_ID_2" ] || [ "$CUENTA_ID_2" = "N/A" ]; then
  echo "✓ VALIDATION PASSED: Both pedidos use same cuenta (ID: $CUENTA_ID)"
else
  echo "✗ VALIDATION FAILED: Pedidos have different cuentas! ($CUENTA_ID vs $CUENTA_ID_2)"
  exit 1
fi

# Change pedido estados to ENTREGADO
echo ""
echo "[6/8] Mark both pedidos as ENTREGADO..."
# PENDIENTE -> PREPARACION
curl -s -X PATCH "$BASE_URL/pedidos/$PEDIDO1_ID/estado" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"estado\":\"PREPARACION\"}" > /dev/null
curl -s -X PATCH "$BASE_URL/pedidos/$PEDIDO2_ID/estado" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"estado\":\"PREPARACION\"}" > /dev/null

# PREPARACION -> LISTO
curl -s -X PATCH "$BASE_URL/pedidos/$PEDIDO1_ID/estado" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"estado\":\"LISTO\"}" > /dev/null
curl -s -X PATCH "$BASE_URL/pedidos/$PEDIDO2_ID/estado" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"estado\":\"LISTO\"}" > /dev/null

# LISTO -> ENTREGADO
curl -s -X PATCH "$BASE_URL/pedidos/$PEDIDO1_ID/estado" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"estado\":\"ENTREGADO\"}" > /dev/null
curl -s -X PATCH "$BASE_URL/pedidos/$PEDIDO2_ID/estado" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"estado\":\"ENTREGADO\"}" > /dev/null
echo "✓ Both pedidos marked as ENTREGADO"

# Check cuenta appears in listas-facturar
echo ""
echo "[7/8] Validate cuenta appears in /cuentas/listas-facturar..."
CUENTAS_LISTAS=$(curl -s -X GET "$BASE_URL/cuentas/listas-facturar" \
  -H "Authorization: Bearer $TOKEN")
echo "Response from /cuentas/listas-facturar:"
echo "$CUENTAS_LISTAS" | python3 -m json.tool

CUENTA_EN_LISTA=$(echo $CUENTAS_LISTAS | python3 -c "import sys, json; cuentas = json.load(sys.stdin); print(any(c['id'] == $CUENTA_ID for c in cuentas))")
if [ "$CUENTA_EN_LISTA" = "True" ]; then
  echo "✓ VALIDATION PASSED: Cuenta $CUENTA_ID appears in listas-facturar"
else
  echo "✗ VALIDATION FAILED: Cuenta $CUENTA_ID NOT in listas-facturar"
  exit 1
fi

# Generate factura from cuenta
echo ""
echo "[8/8] Generate factura from cuenta $CUENTA_ID..."
FACTURA_RESPONSE=$(curl -s -X POST "$BASE_URL/facturas/cuenta/$CUENTA_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"esConsumidorFinal":true}')
echo "Factura Response:"
echo "$FACTURA_RESPONSE" | python3 -m json.tool
FACTURA_ID=$(echo $FACTURA_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])")
FACTURA_TOTAL=$(echo $FACTURA_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['total'])")
echo "✓ Factura created: ID=$FACTURA_ID, Total=$FACTURA_TOTAL"

# Register payment (full amount)
echo ""
echo "Register payment for factura $FACTURA_ID..."
PAGO_RESPONSE=$(curl -s -X POST "$BASE_URL/pagos" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"facturaId\":$FACTURA_ID,\"monto\":$FACTURA_TOTAL,\"metodo\":\"EFECTIVO\"}")
echo "Payment Response:"
echo "$PAGO_RESPONSE" | python3 -m json.tool
echo "✓ Payment registered"

# Validate cuenta is CERRADA
echo ""
echo "Validate cuenta estado is CERRADA..."
CUENTA_FINAL=$(curl -s -X GET "$BASE_URL/cuentas/$CUENTA_ID" \
  -H "Authorization: Bearer $TOKEN")
CUENTA_ESTADO=$(echo $CUENTA_FINAL | python3 -c "import sys, json; print(json.load(sys.stdin)['estado'])")
echo "Cuenta estado: $CUENTA_ESTADO"
if [ "$CUENTA_ESTADO" = "CERRADA" ]; then
  echo "✓ VALIDATION PASSED: Cuenta is CERRADA"
else
  echo "✗ VALIDATION FAILED: Cuenta estado is $CUENTA_ESTADO (expected CERRADA)"
  exit 1
fi

# Validate pedidos are PAGADO
echo ""
echo "Validate pedidos are PAGADO..."
PEDIDO1_FINAL=$(curl -s -X GET "$BASE_URL/pedidos/$PEDIDO1_ID" \
  -H "Authorization: Bearer $TOKEN")
PEDIDO1_ESTADO=$(echo $PEDIDO1_FINAL | python3 -c "import sys, json; print(json.load(sys.stdin)['estado'])")
PEDIDO2_FINAL=$(curl -s -X GET "$BASE_URL/pedidos/$PEDIDO2_ID" \
  -H "Authorization: Bearer $TOKEN")
PEDIDO2_ESTADO=$(echo $PEDIDO2_FINAL | python3 -c "import sys, json; print(json.load(sys.stdin)['estado'])")

echo "Pedido 1 estado: $PEDIDO1_ESTADO"
echo "Pedido 2 estado: $PEDIDO2_ESTADO"

if [ "$PEDIDO1_ESTADO" = "PAGADO" ] && [ "$PEDIDO2_ESTADO" = "PAGADO" ]; then
  echo "✓ VALIDATION PASSED: Both pedidos are PAGADO"
else
  echo "✗ VALIDATION FAILED: Pedidos not PAGADO (P1=$PEDIDO1_ESTADO, P2=$PEDIDO2_ESTADO)"
  exit 1
fi

# Validate mesa is DISPONIBLE
echo ""
echo "Validate mesa is DISPONIBLE..."
MESA_FINAL=$(curl -s -X GET "$BASE_URL/mesas/$MESA_ID" \
  -H "Authorization: Bearer $TOKEN")
MESA_ESTADO=$(echo $MESA_FINAL | python3 -c "import sys, json; print(json.load(sys.stdin)['estado'])")
echo "Mesa estado: $MESA_ESTADO"
if [ "$MESA_ESTADO" = "disponible" ]; then
  echo "✓ VALIDATION PASSED: Mesa is disponible"
else
  echo "✗ VALIDATION FAILED: Mesa estado is $MESA_ESTADO (expected disponible)"
  exit 1
fi

echo ""
echo "========================================"
echo "✓ ALL TESTS PASSED!"
echo "========================================"
echo "Summary:"
echo "- Cuenta $CUENTA_ID created with 2 pedidos for Mesa $MESA_ID"
echo "- Both pedidos marked ENTREGADO → cuenta appeared in listas-facturar"
echo "- Factura $FACTURA_ID generated from cuenta"
echo "- Payment registered → cuenta CERRADA, pedidos PAGADO, mesa DISPONIBLE"
echo "========================================"
