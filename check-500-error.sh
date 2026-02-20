#!/bin/bash
echo "🔍 Investigando erro 500 no GET messages"
echo "========================================"
echo ""

cd /var/www/govchat || exit 1

echo "1️⃣ Limpando logs..."
pm2 flush govchat-backend
sleep 1

echo ""
echo "2️⃣ Testando endpoint (vai retornar 401 sem token)..."
curl -s http://localhost:3001/api/conversations/39d89021-95e0-4d01-a47d-7261431e1791/messages \
  -w "\nHTTP: %{http_code}\n"

echo ""
echo "3️⃣ LOGS DE ERRO (crítico):"
pm2 logs govchat-backend --err --lines 50 --nostream

echo ""
echo "4️⃣ Mostrando query SQL do endpoint..."
cd backend/src
LINE=$(grep -n "app.get('/api/conversations/:id/messages'" server.ts | cut -d: -f1)
echo "Endpoint na linha: $LINE"
sed -n "$((LINE+5)),$((LINE+25))p" server.ts

echo ""
echo "═══════════════════════════════════════════════════════"
echo "ENVIE TODO O OUTPUT - especialmente os logs de erro!"
echo "═══════════════════════════════════════════════════════"
