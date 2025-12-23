#!/bin/bash
TOKEN=$(curl -s -X POST "http://localhost:8080/auth/login" -H "Content-Type: application/json" -d '{"email":"admin@sailor.com","password":"admin123"}' | python3 -c "import sys, json; print(json.load(sys.stdin)['accessToken'])")
echo "Token: $TOKEN"
echo ""
echo "Cuenta 1 details:"
curl -s -X GET "http://localhost:8080/cuentas/1" -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
echo ""
echo "All cuentas abiertas:"
curl -s -X GET "http://localhost:8080/cuentas/abiertas" -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
echo ""
echo "All cuentas listas:"
curl -s -X GET "http://localhost:8080/cuentas/listas-facturar" -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
