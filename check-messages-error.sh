#!/bin/bash

echo "🔍 INVESTIGANDO ERRO 500 NO GET MESSAGES"
echo "========================================"
echo ""

cd /var/www/govchat || exit 1

echo "1️⃣ Limpando logs e testando..."
pm2 flush govchat-backend
sleep 1

echo "2️⃣ Fazendo requisição e capturando erro..."
# Simular requisição (vai falhar sem token, mas mostra se endpoint existe)
curl -s http://localhost:3001/api/conversations/39d89021-95e0-4d01-a47d-7261431e1791/messages \
  -w "\nHTTP: %{http_code}\n"
echo ""

echo "3️⃣ Logs de erro (últimas 50 linhas)..."
pm2 logs govchat-backend --err --lines 50 --nostream | tail -30
echo ""

echo "4️⃣ Mostrando código do endpoint GET messages..."
cd backend/src
LINE=$(grep -n "app.get('/api/conversations/:id/messages'" server.ts | cut -d: -f1)
echo "Linha: $LINE"
sed -n "${LINE},$((LINE+40))p" server.ts
echo ""

echo "5️⃣ Verificando qual tabela está usando..."
sed -n "${LINE},$((LINE+50))p" server.ts | grep -E "FROM|whatsapp_messages|messages" | head -10
echo ""

echo "═══════════════════════════════════════════════════════"
echo "ENVIE TODO O OUTPUT - especialmente o erro do passo 3!"
echo "═══════════════════════════════════════════════════════"
