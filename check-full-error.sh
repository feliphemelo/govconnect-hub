#!/bin/bash
echo "🔍 INVESTIGAÇÃO COMPLETA DO ERRO 500"
echo "===================================="
echo ""

echo "📍 1. Mostrando código do endpoint GET messages"
echo "-----------------------------------------------"
cd /var/www/govchat/backend/src
grep -A 50 "GET.*conversations.*:id.*messages" server.ts | head -60

echo ""
echo "📍 2. Verificando se tabela whatsapp_messages existe"
echo "----------------------------------------------------"
sudo -u postgres psql govchat -c "\d whatsapp_messages"

echo ""
echo "📍 3. Testando query SQL diretamente"
echo "-------------------------------------"
sudo -u postgres psql govchat -c "
SELECT 
    wm.*,
    wc.phone,
    wc.contact_name
FROM whatsapp_messages wm
JOIN whatsapp_chats wc ON wm.chat_id = wc.id
WHERE wc.id = '39d89021-95e0-4d01-a47d-7261431e1791'
ORDER BY wm.timestamp ASC
LIMIT 5;
"

echo ""
echo "📍 4. Verificando estrutura da tabela"
echo "--------------------------------------"
sudo -u postgres psql govchat -c "\d+ whatsapp_messages"

echo ""
echo "📍 5. Últimos erros do PM2"
echo "--------------------------"
pm2 flush govchat-backend
sleep 2
curl -s https://atendimento.nextplan.tec.br/api/conversations/39d89021-95e0-4d01-a47d-7261431e1791/messages \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjk2YjQ5Ny02OTdlLTRkNWQtOTU1Zi0xMjBjM2UyMzY3YzciLCJlbWFpbCI6ImZlbGlwaGVtZWxvQGdtYWlsLmNvbSIsImNvbXBhbnlJZCI6IjIzZjcwYjY1LWUyZTMtNDZlMS1hZDE0LTE2NzA4Mzg0Njc0MCIsImlhdCI6MTczOTk5NDQyOSwiZXhwIjoxNzQwMDgwODI5fQ.lO9lx74yAyFwxYJ5M8Wo-2r4xd9Ek5qK0sTJZCKg6pg" \
  > /dev/null 2>&1
sleep 1
pm2 logs govchat-backend --err --lines 30 --nostream

echo ""
echo "📍 6. Últimos logs completos"
echo "----------------------------"
pm2 logs govchat-backend --lines 20 --nostream

