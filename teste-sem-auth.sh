#!/bin/bash

echo "🧪 TESTE DE ENVIO SEM AUTENTICAÇÃO"
echo "=================================="
echo ""
echo "Execute na VPS: /var/www/govchat/backend/src"
echo ""

cat << 'VPSSCRIPT'
cd /var/www/govchat/backend/src && \

echo "=== 1. Fazer backup do server.ts ===" && \
cp server.ts server.ts.backup_auth_test && \

echo "" && \
echo "=== 2. Encontrar linha do endpoint POST ===" && \
LINE_NUM=$(grep -n "app.post('/api/conversations/:id/messages', authMiddleware" server.ts | cut -d: -f1) && \
echo "Endpoint encontrado na linha: $LINE_NUM" && \

echo "" && \
echo "=== 3. Remover authMiddleware temporariamente ===" && \
sed -i "${LINE_NUM}s/, authMiddleware//" server.ts && \

echo "" && \
echo "=== 4. Verificar alteração ===" && \
grep -n "app.post('/api/conversations/:id/messages'" server.ts && \

echo "" && \
echo "=== 5. Recompilar ===" && \
cd /var/www/govchat/backend && \
npm run build && \

echo "" && \
echo "=== 6. Reiniciar PM2 ===" && \
pm2 restart govchat-backend && \
sleep 3 && \

echo "" && \
echo "=== 7. Limpar logs ===" && \
pm2 flush govchat-backend && \
sleep 1 && \

echo "" && \
echo "=== 8. TESTAR ENVIO SEM AUTH ===" && \
curl -X POST "http://localhost:3001/api/conversations/39d89021-95e0-4d01-a47d-7261431e1791/messages" \
  -H "Content-Type: application/json" \
  -d '{"content": "🎉 Teste sem auth!", "message_type": "text"}' | python3 -m json.tool && \

echo "" && \
sleep 2 && \

echo "" && \
echo "=== 9. LOGS DO PM2 ===" && \
pm2 logs govchat-backend --lines 60 --nostream && \

echo "" && \
echo "" && \
echo "=== 10. RESTAURAR authMiddleware ===" && \
cd /var/www/govchat/backend/src && \
cp server.ts.backup_auth_test server.ts && \
cd /var/www/govchat/backend && \
npm run build && \
pm2 restart govchat-backend && \

echo "" && \
echo "✅ Teste concluído e authMiddleware restaurado!"
VPSSCRIPT

echo ""
echo "📋 Execute o comando VPSSCRIPT acima na VPS"
