#!/bin/bash

set -e  # Exit on error

API_URL="http://localhost:8080"
ADMIN_EMAIL="admin@sailor.com"
ADMIN_PASSWORD="admin123"
USER_EMAIL="user@sailor.com"
USER_PASSWORD="user123"

echo "=========================================="
echo "TEST: Precio Editable Solo por ADMIN"
echo "=========================================="
echo ""

# Step 1: Login as ADMIN
echo "[1/4] Logging in as ADMIN..."
ADMIN_LOGIN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

ADMIN_TOKEN=$(echo "$ADMIN_LOGIN" | python3 -c "import sys, json; print(json.load(sys.stdin)['accessToken'])" 2>/dev/null || echo "")

if [ -z "$ADMIN_TOKEN" ]; then
  echo "❌ ERROR: ADMIN login failed"
  echo "Response: $ADMIN_LOGIN"
  exit 1
fi

echo "✅ ADMIN login successful"
echo ""

# Step 2: Get a producto to test with
echo "[2/4] Getting a producto to test..."
PRODUCTOS_RESPONSE=$(curl -s -X GET "$API_URL/productos" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

PRODUCTO_ID=$(echo "$PRODUCTOS_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data[0]['id'] if len(data) > 0 else '')" 2>/dev/null || echo "")
PRODUCTO_PRECIO_ORIGINAL=$(echo "$PRODUCTOS_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data[0]['precio'] if len(data) > 0 else '')" 2>/dev/null || echo "")

if [ -z "$PRODUCTO_ID" ]; then
  echo "❌ ERROR: No products found for testing"
  exit 1
fi

echo "✅ Using producto ID: $PRODUCTO_ID (precio original: ₡$PRODUCTO_PRECIO_ORIGINAL)"
echo ""

# Step 3: ADMIN attempts to update precio (should succeed)
echo "[3/4] ADMIN attempting to update precio..."
NUEVO_PRECIO=999.99

ADMIN_UPDATE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X PATCH "$API_URL/productos/$PRODUCTO_ID/precio" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"precio\":$NUEVO_PRECIO}")

ADMIN_HTTP_STATUS=$(echo "$ADMIN_UPDATE" | grep "HTTP_STATUS:" | cut -d: -f2)
ADMIN_BODY=$(echo "$ADMIN_UPDATE" | sed '/HTTP_STATUS:/d')

if [ "$ADMIN_HTTP_STATUS" != "200" ]; then
  echo "❌ ERROR: ADMIN update failed with status $ADMIN_HTTP_STATUS"
  echo "Response: $ADMIN_BODY"
  exit 1
fi

echo "✅ ADMIN successfully updated precio to ₡$NUEVO_PRECIO (HTTP 200)"
echo ""

# Step 4: Login as USER (MESERO) and attempt to update precio (should fail with 403)
echo "[4/4] Logging in as USER (MESERO) and attempting to update precio..."
USER_LOGIN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$USER_EMAIL\",\"password\":\"$USER_PASSWORD\"}")

USER_TOKEN=$(echo "$USER_LOGIN" | python3 -c "import sys, json; print(json.load(sys.stdin)['accessToken'])" 2>/dev/null || echo "")

if [ -z "$USER_TOKEN" ]; then
  echo "❌ ERROR: USER login failed"
  echo "Response: $USER_LOGIN"
  exit 1
fi

echo "✅ USER login successful"
echo ""

echo "USER attempting to update precio (should be FORBIDDEN)..."
USER_UPDATE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X PATCH "$API_URL/productos/$PRODUCTO_ID/precio" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d "{\"precio\":1234.56}")

USER_HTTP_STATUS=$(echo "$USER_UPDATE" | grep "HTTP_STATUS:" | cut -d: -f2)
USER_BODY=$(echo "$USER_UPDATE" | sed '/HTTP_STATUS:/d')

if [ "$USER_HTTP_STATUS" != "403" ]; then
  echo "❌ ERROR: USER should have received 403 FORBIDDEN but got $USER_HTTP_STATUS"
  echo "Response: $USER_BODY"
  echo ""
  echo "This is a SECURITY VULNERABILITY! Non-ADMIN users can update prices!"
  exit 1
fi

echo "✅ USER correctly received 403 FORBIDDEN (non-ADMIN cannot update prices)"
echo ""

# Step 5: Restore original precio
echo "[5/4] Restoring original precio..."
curl -s -X PATCH "$API_URL/productos/$PRODUCTO_ID/precio" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"precio\":$PRODUCTO_PRECIO_ORIGINAL}" > /dev/null

echo "✅ Precio restored to ₡$PRODUCTO_PRECIO_ORIGINAL"
echo ""

echo "=========================================="
echo "✅ ALL TESTS PASSED!"
echo "=========================================="
echo ""
echo "Summary:"
echo "- ADMIN can update precios (HTTP 200)"
echo "- USER/MESERO cannot update precios (HTTP 403)"
echo "- Endpoint /productos/{id}/precio is properly secured"
echo ""
echo "Next step: Verify in UI at /productos"
echo "- ADMIN should see edit button (✎) next to price"
echo "- MESERO should NOT see edit button"
