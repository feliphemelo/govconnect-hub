#!/bin/bash

echo "🚀 Script para testar envio de mensagem WhatsApp"
echo ""
echo "==================================="
echo "EXECUTAR NA VPS: /var/www/govchat"
echo "==================================="
echo ""

cat << 'VPSSCRIPT'
cd /var/www/govchat/backend && \

echo "=== 1. Compilando backend atualizado ===" && \
npm run build && \

echo "" && \
echo "=== 2. Reiniciando serviço PM2 ===" && \
pm2 restart govchat-backend && \
sleep 3 && \

echo "" && \
echo "=== 3. Verificando status PM2 ===" && \
pm2 status govchat-backend && \

echo "" && \
echo "=== 4. Limpando logs ===" && \
pm2 flush govchat-backend && \
sleep 1 && \

echo "" && \
echo "=== 5. Enviando mensagem de teste via curl ===" && \
curl -X POST "http://localhost:3001/api/conversations/39d89021-95e0-4d01-a47d-7261431e1791/messages" \
  -H "Content-Type: application/json" \
  -d '{"content": "🎉 Teste de envio WhatsApp via backend!", "message_type": "text"}' \
  2>&1 | python3 -m json.tool && \

echo "" && \
echo "" && \
echo "=== 6. Logs do PM2 (últimas 40 linhas) ===" && \
sleep 2 && \
pm2 logs govchat-backend --lines 40 --nostream | tail -40
VPSSCRIPT

echo ""
echo "✅ Script gerado!"
echo ""
echo "📋 INSTRUÇÕES:"
echo "1. Copie o código VPSSCRIPT acima"
echo "2. Execute na VPS dentro do diretório /var/www/govchat"
echo "3. Envie o resultado completo dos logs"
echo ""
