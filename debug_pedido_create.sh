#!/bin/bash
TOKEN=$(curl -s -X POST "http://localhost:8080/auth/login" -H "Content-Type: application/json" -d '{"email":"admin@sailor.com","password":"admin123"}' | python3 -c "import sys, json; print(json.load(sys.stdin)['accessToken'])")
echo "Token: ${TOKEN:0:20}..."
echo ""
echo "Creating pedido for Mesa 9, Product 11..."
RESPONSE=$(curl -v -X POST "http://localhost:8080/pedidos" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"mesaId":9,"items":[{"productoId":11,"cantidad":2}],"observaciones":"Test Pedido Debug"}' 2>&1)
echo "$RESPONSE"
