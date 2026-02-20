#!/bin/bash

echo "🔍 INVESTIGANDO ENDPOINT DE CONVERSAS"
echo "====================================="
echo ""

cd /var/www/govchat/backend/src || exit 1

echo "1️⃣ Verificando endpoint GET /api/conversations..."
grep -n "GET /api/conversations" server.ts | head -5
echo ""

echo "2️⃣ Mostrando código do endpoint (primeiras ocorrências)..."
LINE=$(grep -n "app.get('/api/conversations'" server.ts | head -1 | cut -d: -f1)
if [ ! -z "$LINE" ]; then
    echo "   Encontrado na linha $LINE"
    sed -n "${LINE},$((LINE+30))p" server.ts
else
    echo "❌ Endpoint não encontrado!"
fi
echo ""

echo "3️⃣ Verificando qual tabela está sendo consultada..."
grep -A 20 "GET /api/conversations" server.ts | grep -E "FROM|whatsapp_chats|conversations" | head -10
echo ""

echo "4️⃣ Testando endpoint diretamente..."
echo "   Fazendo GET /api/conversations..."
# Primeiro precisamos de um token válido
echo "   (Sem token - esperado 401)"
curl -s http://localhost:3001/api/conversations -w "\nHTTP: %{http_code}\n"
echo ""

echo "5️⃣ Verificando dados reais no banco..."
echo "   Tabela whatsapp_chats:"
cd /var/www/govchat/backend
export PGPASSWORD="TKyhdmL1GDvd"
psql -h localhost -U postgres -d govchat_db -c "SELECT COUNT(*) as total_chats FROM whatsapp_chats;" 2>&1 | head -5
echo ""

echo "   Tabela conversations (antiga):"
psql -h localhost -U postgres -d govchat_db -c "SELECT COUNT(*) as total_conversations FROM conversations;" 2>&1 | head -5
echo ""

echo "6️⃣ Mostrando registros de exemplo..."
psql -h localhost -U postgres -d govchat_db -c "SELECT id, chat_id, contact_name, contact_number FROM whatsapp_chats LIMIT 3;" 2>&1
echo ""

echo "7️⃣ Verificando logs recentes..."
pm2 logs govchat-backend --lines 20 --nostream | grep -i "conversations\|GET" | tail -10
echo ""

echo "═══════════════════════════════════════════════════════"
echo "ANÁLISE:"
echo ""
echo "Se o endpoint usa 'conversations' (tabela antiga):"
echo "  → Precisa mudar para 'whatsapp_chats'"
echo ""
echo "Se o endpoint já usa 'whatsapp_chats':"
echo "  → Verificar se há filtros incorretos (company_id, etc)"
echo ""
echo "ENVIE TODO O OUTPUT!"
echo "═══════════════════════════════════════════════════════"
