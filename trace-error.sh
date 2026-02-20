#!/bin/bash
echo "🔍 RASTREANDO ERRO 500 EM TEMPO REAL"
echo "===================================="
echo ""

echo "📍 1. Status do PM2"
echo "------------------"
pm2 status govchat-backend

echo ""
echo "📍 2. Limpando logs"
echo "------------------"
pm2 flush govchat-backend
echo "✅ Logs limpos"

echo ""
echo "📍 3. Fazendo requisição de teste (em 3 segundos)..."
echo "---------------------------------------------------"
sleep 3

# Pegar token do banco
TOKEN=$(sudo -u postgres psql govchat_nextplan -t -c "
SELECT 
    'Bearer ' || encode(
        convert_to(
            '{"userId":"' || id || '","email":"' || email || '","companyId":"' || company_id || '"}',
            'UTF8'
        ),
        'base64'
    )
FROM auth_users 
WHERE email = 'feliphe@example.com' OR email = 'feliphemelo@gmail.com'
LIMIT 1;" | tr -d ' ')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "Bearer" ]; then
    echo "⚠️ Token não encontrado, usando token de teste"
    TOKEN="Bearer test123"
fi

echo "🔑 Token: ${TOKEN:0:50}..."

# Fazer requisição
echo ""
echo "📡 Fazendo GET request..."
curl -v \
  -H "Authorization: $TOKEN" \
  https://atendimento.nextplan.tec.br/api/conversations/39d89021-95e0-4d01-a47d-7261431e1791/messages \
  2>&1 | grep -E "(< HTTP|< Content-Type|error|Error)"

echo ""
echo ""
echo "📍 4. Logs de ERRO após requisição"
echo "----------------------------------"
sleep 1
pm2 logs govchat-backend --err --lines 50 --nostream

echo ""
echo "📍 5. Logs COMPLETOS após requisição"
echo "------------------------------------"
pm2 logs govchat-backend --lines 50 --nostream

echo ""
echo "📍 6. Verificando se o backend está respondendo"
echo "-----------------------------------------------"
curl -s https://atendimento.nextplan.tec.br/api/health || echo "❌ Health check falhou"

echo ""
echo "📍 7. Verificando query problemática no código"
echo "----------------------------------------------"
cd /var/www/govchat/backend/src
echo "Linha 1335-1350 do server.ts:"
sed -n '1335,1350p' server.ts

echo ""
echo "📍 8. Testando query SQL diretamente no banco"
echo "---------------------------------------------"
sudo -u postgres psql govchat_nextplan -c "
SELECT
  id,
  '39d89021-95e0-4d01-a47d-7261431e1791' as conversation_id,
  from_number as sender_id,
  content,
  message_type,
  created_at,
  is_from_me,
  NOT is_from_me as is_from_customer
FROM whatsapp_messages
WHERE chat_id = (SELECT chat_id FROM whatsapp_chats WHERE id = '39d89021-95e0-4d01-a47d-7261431e1791')
ORDER BY created_at ASC
LIMIT 5;
"

