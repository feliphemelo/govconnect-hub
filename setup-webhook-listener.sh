#!/bin/bash
echo "📡 CONFIGURANDO LISTENER DE MENSAGENS RECEBIDAS"
echo "==============================================="
echo ""

echo "📍 PASSO 2: Aguardar Contato Inicial"
echo "------------------------------------"
echo ""
echo "Quando o usuário envia a PRIMEIRA mensagem pelo WhatsApp:"
echo "  1. Baileys recebe a mensagem"
echo "  2. Sistema captura o JID correto (número@s.whatsapp.net)"
echo "  3. Salva no banco automaticamente"
echo "  4. Sistema pode responder usando o JID correto"
echo ""

echo "📍 1. Verificando handler de mensagens no WebSocket"
echo "---------------------------------------------------"
cd /var/www/govchat/backend/src
grep -n "handleChatMessage" websocket.ts | head -5

echo ""
echo "📍 2. Verificando salvamento de mensagens recebidas"
echo "---------------------------------------------------"
grep -A 20 "async handleChatMessage" websocket.ts | head -25

echo ""
echo "📍 3. Como funciona:"
echo "-------------------"
echo "✅ Usuário envia mensagem → WhatsApp → Baileys"
echo "✅ Baileys emite evento → WebSocket captura"
echo "✅ Sistema salva: from_number (remetente), chat_id"
echo "✅ Resposta usa o mesmo chat_id"
echo ""

echo "📍 4. Testando recepção de mensagens"
echo "------------------------------------"
echo "🧪 TESTE:"
echo "   1. Pegue seu telefone"
echo "   2. Abra o WhatsApp"
echo "   3. Envie uma mensagem para o número da instância"
echo "   4. Aguarde 2 segundos"
echo ""
read -p "Pressione ENTER após enviar a mensagem..." 

echo ""
echo "📍 5. Verificando logs de recepção"
echo "----------------------------------"
pm2 logs govchat-backend --lines 30 --nostream

echo ""
echo "📍 6. Verificando novos chats no banco"
echo "--------------------------------------"
sudo -u postgres psql govchat_nextplan -c "
SELECT 
    id,
    chat_id,
    contact_number,
    contact_name,
    last_message,
    last_message_at
FROM whatsapp_chats 
WHERE last_message_at > NOW() - INTERVAL '5 minutes'
ORDER BY last_message_at DESC;
"

echo ""
echo "📍 7. Verificando mensagens recentes"
echo "------------------------------------"
sudo -u postgres psql govchat_nextplan -c "
SELECT 
    from_number,
    to_number,
    content,
    is_from_me,
    created_at
FROM whatsapp_messages 
WHERE created_at > NOW() - INTERVAL '5 minutes'
ORDER BY created_at DESC
LIMIT 5;
"

echo ""
echo "✅ ANÁLISE:"
echo "==========="
echo "Se você viu:"
echo "  ✅ Logs de 'Nova mensagem recebida'"
echo "  ✅ Chat criado/atualizado no banco"
echo "  ✅ from_number com formato @s.whatsapp.net"
echo ""
echo "Então o sistema ESTÁ funcionando corretamente!"
echo ""
echo "🎯 PRÓXIMO PASSO:"
echo "   1. Responda a mensagem pela interface"
echo "   2. A resposta vai usar o from_number (número correto)"
echo "   3. A mensagem deve chegar no WhatsApp!"

