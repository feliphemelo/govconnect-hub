#!/bin/bash
echo "🔧 INVESTIGANDO E CORRIGINDO FORMATO @lid"
echo "=========================================="
echo ""

echo "📍 1. Todos os chats no banco"
echo "-----------------------------"
sudo -u postgres psql govchat_nextplan -c "
SELECT 
    id,
    chat_id,
    contact_name,
    contact_number,
    LEFT(instance_id::text, 8) as instance
FROM whatsapp_chats 
ORDER BY last_message_at DESC
LIMIT 10;
"

echo ""
echo "📍 2. Verificando estrutura da tabela whatsapp_chats"
echo "----------------------------------------------------"
sudo -u postgres psql govchat_nextplan -c "\d whatsapp_chats" | head -30

echo ""
echo "📍 3. Verificando se chat_id tem o formato correto"
echo "--------------------------------------------------"
sudo -u postgres psql govchat_nextplan -c "
SELECT 
    chat_id,
    contact_number,
    contact_name,
    CASE 
        WHEN chat_id LIKE '%@s.whatsapp.net' THEN '✅ Formato correto'
        WHEN chat_id LIKE '%@lid' THEN '❌ Canal/Lista'
        WHEN chat_id LIKE '%@g.us' THEN '👥 Grupo'
        ELSE '❓ Formato desconhecido'
    END as tipo
FROM whatsapp_chats
LIMIT 10;
"

echo ""
echo "📍 4. Problema identificado"
echo "---------------------------"
echo "O contact_number está salvo como 32727717949659@lid"
echo "Isso é um identificador de CANAL ou LISTA DO WHATSAPP"
echo ""
echo "💡 Possibilidades:"
echo "   A) Realmente é um canal (não pode enviar mensagens)"
echo "   B) O número foi extraído errado do chat_id"
echo "   C) Precisa converter @lid para @s.whatsapp.net"
echo ""
echo "🔍 Para enviar mensagens, precisamos do número REAL do contato"
echo "   Formato: 5511999999999@s.whatsapp.net"

echo ""
echo "📍 5. Verificando instância WhatsApp"
echo "------------------------------------"
sudo -u postgres psql govchat_nextplan -c "
SELECT 
    id,
    name,
    phone_number,
    status,
    qr_code IS NOT NULL as has_qr
FROM whatsapp_instances
LIMIT 5;
"

echo ""
echo "📱 PRÓXIMOS PASSOS:"
echo "=================="
echo "1. Confirme: este chat é de um CANAL do WhatsApp?"
echo "2. Ou é um contato normal que foi salvo errado?"
echo "3. Se for contato normal, qual é o número real (com DDD)?"
echo "   Ex: +55 11 99999-9999 = 5511999999999"

