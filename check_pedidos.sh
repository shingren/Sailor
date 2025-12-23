#!/bin/bash
TOKEN=$(curl -s -X POST "http://localhost:8080/auth/login" -H "Content-Type: application/json" -d '{"email":"admin@sailor.com","password":"admin123"}' | python3 -c "import sys, json; print(json.load(sys.stdin)['accessToken'])")
echo "Pedido 22:"
curl -s -X GET "http://localhost:8080/pedidos/22" -H "Authorization: Bearer $TOKEN" | python3 -c "import sys, json; p = json.load(sys.stdin); print(f\"Estado: {p['estado']}\")"
echo ""
echo "Pedido 23:"
curl -s -X GET "http://localhost:8080/pedidos/23" -H "Authorization: Bearer $TOKEN" | python3 -c "import sys, json; p = json.load(sys.stdin); print(f\"Estado: {p['estado']}\")"
