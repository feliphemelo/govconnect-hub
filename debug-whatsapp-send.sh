#!/bin/bash

echo "🔍 SCRIPT DE DEBUG - ENVIO WHATSAPP"
echo "=================================="
echo ""
echo "Execute na VPS: /var/www/govchat"
echo ""

cat << 'VPSSCRIPT'
cd /var/www/govchat && \

echo "=== 1. Limpar logs do PM2 ===" && \
pm2 flush govchat-backend && \
sleep 1 && \

echo "" && \
echo "=== 2. Enviar mensagem de teste ===" && \
curl -X POST "http://localhost:3001/api/conversations/39d89021-95e0-4d01-a47d-7261431e1791/messages" \
  -H "Content-Type: application/json" \
  -d '{"content": "Debug teste", "message_type": "text"}' 2>&1 > /dev/null && \

echo "" && \
sleep 2 && \

echo "=== 3. Logs completos do PM2 ===" && \
pm2 logs govchat-backend --lines 50 --nostream && \

echo "" && \
echo "" && \
echo "=== 4. Verificar se método sendMessage existe no código compilado ===" && \
grep -n "sendMessage" backend/dist/services/whatsapp.service.js | head -5 && \

echo "" && \
echo "=== 5. Verificar se whatsappService.sendMessage é chamado no server.js ===" && \
grep -n "whatsappService.sendMessage" backend/dist/server.js | head -5 && \

echo "" && \
echo "=== 6. Status da instância WhatsApp ===" && \
echo "SELECT id, status FROM whatsapp_instances;" | \
  PGPASSWORD='jjROqoI9CRXKYqxsYc0CGkXFS' \
  psql -h localhost -U govchat_user -d govchat_nextplan && \

echo "" && \
echo "=== 7. Verificar dados do chat ===" && \
echo "SELECT id, chat_id, instance_id FROM whatsapp_chats WHERE id = '39d89021-95e0-4d01-a47d-7261431e1791';" | \
  PGPASSWORD='jjROqoI9CRXKYqxsYc0CGkXFS' \
  psql -h localhost -U govchat_user -d govchat_nextplan
VPSSCRIPT

echo ""
echo "✅ Execute o comando acima na VPS e me envie TODOS os logs!"
