#!/bin/bash

set -e  # Exit on error

API_URL="http://localhost:8080"
EMAIL="admin@sailor.com"
PASSWORD="admin123"

echo "=========================================="
echo "TEST: Extras en Pedidos Listos para Facturar"
echo "=========================================="
echo ""

# Step 1: Login
echo "[1/5] Logging in as $EMAIL..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['accessToken'])" 2>/dev/null || echo "")

if [ -z "$TOKEN" ]; then
  echo "❌ ERROR: Login failed"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Login successful"
echo ""

# Step 2: Create order with extras
echo "[2/5] Creating pedido with Pizza Margherita + extra 'mas masa'..."
PEDIDO_RESPONSE=$(curl -s -X POST "$API_URL/pedidos" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "mesaId": 1,
    "observaciones": "Test pedido con extras para validar listos-facturar",
    "items": [
      {
        "productoId": 1,
        "cantidad": 2,
        "extras": [
          {
            "recetaExtraId": 1,
            "cantidad": 1
          }
        ]
      }
    ]
  }')

PEDIDO_ID=$(echo "$PEDIDO_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])" 2>/dev/null || echo "")

if [ -z "$PEDIDO_ID" ]; then
  echo "❌ ERROR: Failed to create pedido"
  echo "Response: $PEDIDO_RESPONSE"
  exit 1
fi

echo "✅ Pedido created with ID: $PEDIDO_ID"
echo ""

# Step 3: Change estado to PREPARACION
echo "[3/5] Changing pedido estado to PREPARACION..."
curl -s -X PATCH "$API_URL/pedidos/$PEDIDO_ID/estado" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"estado":"PREPARACION"}' > /dev/null

echo "✅ Estado changed to PREPARACION"
echo ""

# Step 4: Change estado to LISTO
echo "[3/5] Changing pedido estado to LISTO..."
curl -s -X PATCH "$API_URL/pedidos/$PEDIDO_ID/estado" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"estado":"LISTO"}' > /dev/null

echo "✅ Estado changed to LISTO"
echo ""

# Step 5: Change estado to ENTREGADO
echo "[4/5] Changing pedido estado to ENTREGADO..."
curl -s -X PATCH "$API_URL/pedidos/$PEDIDO_ID/estado" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"estado":"ENTREGADO"}' > /dev/null

echo "✅ Estado changed to ENTREGADO"
echo ""

# Step 6: Fetch pedidos listos para facturar
echo "[5/5] Fetching pedidos listos para facturar..."
LISTOS_RESPONSE=$(curl -s -X GET "$API_URL/pedidos/listos-facturar" \
  -H "Authorization: Bearer $TOKEN")

# Validate that the response contains the pedido with extras
echo "Response from /pedidos/listos-facturar:"
echo "$LISTOS_RESPONSE" | python3 -m json.tool

echo ""
echo "=========================================="
echo "VALIDATION"
echo "=========================================="

# Check if our pedido is in the list
FOUND_PEDIDO=$(echo "$LISTOS_RESPONSE" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for pedido in data:
    if pedido['id'] == $PEDIDO_ID:
        print('FOUND')
        exit(0)
print('NOT_FOUND')
" 2>/dev/null || echo "ERROR")

if [ "$FOUND_PEDIDO" != "FOUND" ]; then
  echo "❌ ERROR: Pedido #$PEDIDO_ID not found in listos-facturar response"
  exit 1
fi

echo "✅ Pedido #$PEDIDO_ID found in listos-facturar"
echo ""

# Validate that the pedido has extras in the response
HAS_EXTRAS=$(echo "$LISTOS_RESPONSE" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for pedido in data:
    if pedido['id'] == $PEDIDO_ID:
        for item in pedido.get('items', []):
            extras = item.get('extras', [])
            if len(extras) > 0:
                print('HAS_EXTRAS')
                print(f\"Item '{item['productoNombre']}' has {len(extras)} extra(s):\")
                for extra in extras:
                    print(f\"  - {extra['nombre']} x{extra['cantidad']} (₡{extra['precioUnitario']})\")
                exit(0)
print('NO_EXTRAS')
" 2>/dev/null || echo "ERROR")

if [[ "$HAS_EXTRAS" != *"HAS_EXTRAS"* ]]; then
  echo "❌ ERROR: Pedido #$PEDIDO_ID does not have extras in the response!"
  echo "This means the backend is not serializing extras correctly."
  exit 1
fi

echo "✅ Pedido #$PEDIDO_ID has extras in the response:"
echo "$HAS_EXTRAS" | tail -n +2  # Print everything except first line (HAS_EXTRAS flag)
echo ""

# Validate extra details
EXTRA_NAME=$(echo "$LISTOS_RESPONSE" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for pedido in data:
    if pedido['id'] == $PEDIDO_ID:
        for item in pedido.get('items', []):
            for extra in item.get('extras', []):
                print(extra['nombre'])
                exit(0)
" 2>/dev/null || echo "")

EXTRA_PRECIO=$(echo "$LISTOS_RESPONSE" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for pedido in data:
    if pedido['id'] == $PEDIDO_ID:
        for item in pedido.get('items', []):
            for extra in item.get('extras', []):
                print(extra['precioUnitario'])
                exit(0)
" 2>/dev/null || echo "")

if [ -z "$EXTRA_NAME" ] || [ -z "$EXTRA_PRECIO" ]; then
  echo "❌ ERROR: Could not extract extra name or price"
  exit 1
fi

echo "✅ Extra details validated:"
echo "   - Nombre: $EXTRA_NAME"
echo "   - Precio Unitario: ₡$EXTRA_PRECIO"
echo ""

echo "=========================================="
echo "✅ ALL TESTS PASSED!"
echo "=========================================="
echo ""
echo "Summary:"
echo "- Backend correctly serializes extras in /pedidos/listos-facturar"
echo "- Pedido #$PEDIDO_ID has extra '$EXTRA_NAME' (₡$EXTRA_PRECIO)"
echo "- Frontend should now display extras in 'Pedidos Listos para Facturar'"
echo ""
echo "Next step: Verify in UI at /facturas"
