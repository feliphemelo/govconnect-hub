#!/bin/bash
echo "📞 VERIFICANDO FORMATO DO NÚMERO"
echo "================================"
echo ""

echo "📍 1. Dados do chat no banco"
echo "----------------------------"
sudo -u postgres psql govchat_nextplan -c "
SELECT 
    id,
    chat_id,
    contact_name,
    contact_number,
    instance_id
FROM whatsapp_chats 
WHERE id = '39d89021-95e0-4d01-a47d-7261431e1791';
"

echo ""
echo "📍 2. Mensagens do chat"
echo "----------------------"
sudo -u postgres psql govchat_nextplan -c "
SELECT 
    from_number,
    to_number,
    content,
    is_from_me,
    created_at
FROM whatsapp_messages 
WHERE chat_id = (SELECT chat_id FROM whatsapp_chats WHERE id = '39d89021-95e0-4d01-a47d-7261431e1791')
ORDER BY created_at DESC
LIMIT 5;
"

echo ""
echo "📍 3. Verificando formato do número"
echo "-----------------------------------"
echo "❓ O número está como: 32727717949659@lid"
echo "✅ Deveria ser: número@s.whatsapp.net (ex: 5511999999999@s.whatsapp.net)"
echo ""
echo "💡 Possíveis causas:"
echo "   1. Contato é de um canal/lista do WhatsApp (@lid)"
echo "   2. Contato precisa ser convertido para formato correto"
echo "   3. Número salvo errado no banco"

echo ""
echo "📍 4. Verificando se há outros chats com formato correto"
echo "--------------------------------------------------------"
sudo -u postgres psql govchat_nextplan -c "
SELECT 
    contact_number,
    contact_name,
    COUNT(*) as total_messages
FROM whatsapp_chats 
WHERE contact_number LIKE '%@s.whatsapp.net'
GROUP BY contact_number, contact_name
LIMIT 5;
"

