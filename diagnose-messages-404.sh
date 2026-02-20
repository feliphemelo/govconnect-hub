#!/bin/bash

echo "🔍 DIAGNÓSTICO COMPLETO - Endpoints de Mensagens"
echo "================================================"
echo ""

cd /var/www/govchat/backend/src || exit 1

echo "1️⃣ Procurando TODOS os endpoints de conversas e mensagens..."
echo ""
echo "GET /api/conversations:"
grep -n "app.get('/api/conversations'" server.ts | head -10
echo ""
echo "GET /api/conversations/:id/messages:"
grep -n "app.get('/api/conversations/:id/messages'" server.ts | head -10
echo ""
echo "POST /api/conversations/:id/messages:"
grep -n "app.post('/api/conversations/:id/messages'" server.ts | head -10
echo ""

echo "2️⃣ Verificando qual tem authMiddleware..."
echo ""
echo "Endpoints com authMiddleware:"
grep -n "authMiddleware" server.ts | grep "app\.\(get\|post\)" | grep conversations | head -10
echo ""

echo "3️⃣ Contando duplicados..."
GET_CONV_COUNT=$(grep -c "app.get('/api/conversations')" server.ts)
GET_MSG_COUNT=$(grep -c "app.get('/api/conversations/:id/messages'" server.ts)
POST_MSG_COUNT=$(grep -c "app.post('/api/conversations/:id/messages'" server.ts)

echo "GET /api/conversations: $GET_CONV_COUNT"
echo "GET /api/conversations/:id/messages: $GET_MSG_COUNT"
echo "POST /api/conversations/:id/messages: $POST_MSG_COUNT"
echo ""

echo "4️⃣ Mostrando código do endpoint GET messages..."
LINE=$(grep -n "app.get('/api/conversations/:id/messages'" server.ts | head -1 | cut -d: -f1)
if [ ! -z "$LINE" ]; then
    echo "Linha: $LINE"
    sed -n "${LINE},$((LINE+20))p" server.ts
else
    echo "❌ Endpoint não encontrado!"
fi
echo ""

echo "5️⃣ Verificando qual tabela está sendo usada..."
echo "GET /api/conversations/:id/messages usa:"
sed -n "/${LINE}/,/FROM/p" server.ts | grep "FROM" | head -3
echo ""

echo "6️⃣ Testando endpoint diretamente (sem token)..."
curl -s http://localhost:3001/api/conversations/39d89021-95e0-4d01-a47d-7261431e1791/messages \
  -w "\nHTTP: %{http_code}\n" 2>&1 | head -20
echo ""

echo "7️⃣ Verificando logs recentes do PM2..."
pm2 logs govchat-backend --lines 30 --nostream | grep -E "GET|messages|404|conversations" | tail -20
echo ""

echo "═══════════════════════════════════════════════════════"
echo "ANÁLISE NECESSÁRIA:"
echo "- Se GET messages não tem authMiddleware → adicionar"
echo "- Se há duplicados → remover"
echo "- Se usa tabela 'messages' → mudar para 'whatsapp_messages'"
echo ""
echo "ENVIE TODO O OUTPUT!"
echo "═══════════════════════════════════════════════════════"
