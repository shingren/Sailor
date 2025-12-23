#!/bin/bash
TOKEN=$(curl -s -X POST "http://localhost:8080/auth/login" -H "Content-Type: application/json" -d '{"email":"admin@sailor.com","password":"admin123"}' | python3 -c "import sys, json; print(json.load(sys.stdin)['accessToken'])")

echo "Attempting to change Pedido 22 to PREPARACION..."
curl -v -X PATCH "http://localhost:8080/pedidos/22/estado" \
  -H "Content-Type: text/plain" \
  -H "Authorization: Bearer $TOKEN" \
  -d "PREPARACION"
echo ""
echo ""
echo "Checking estado after change..."
curl -s -X GET "http://localhost:8080/pedidos/22" -H "Authorization: Bearer $TOKEN" | python3 -c "import sys, json; p = json.load(sys.stdin); print(f\"Estado: {p['estado']}\")"
