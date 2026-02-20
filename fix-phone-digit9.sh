#!/bin/bash
echo "🔧 CORRIGINDO DÍGITO 9 DO CELULAR"
echo "================================="
echo ""

echo "📍 Problema identificado:"
echo "-------------------------"
echo "Número atual:  5548988578510@s.whatsapp.net"
echo "Deveria ser:   55489888578510@s.whatsapp.net"
echo "               ↑ Falta o 9 aqui"
echo ""

echo "📱 Celulares no Brasil:"
echo "  Formato: 55 + DDD(2) + 9 + NÚMERO(8)"
echo "  Exemplo: 55 48 9 88578510"
echo ""

read -p "Pressione ENTER para corrigir..." 

echo ""
echo "📍 1. Verificando número atual no banco"
echo "---------------------------------------"
sudo -u postgres psql govchat_nextplan -c "
SELECT 
    id,
    contact_name,
    contact_number
FROM whatsapp_chats 
WHERE id = '39d89021-95e0-4d01-a47d-7261431e1791';
"

echo ""
echo "📍 2. Corrigindo para formato correto"
echo "-------------------------------------"
sudo -u postgres psql govchat_nextplan -c "
UPDATE whatsapp_chats 
SET contact_number = '55489888578510@s.whatsapp.net'
WHERE id = '39d89021-95e0-4d01-a47d-7261431e1791';
"

echo "✅ Número corrigido!"

echo ""
echo "📍 3. Verificando alteração"
echo "--------------------------"
sudo -u postgres psql govchat_nextplan -c "
SELECT 
    id,
    contact_name,
    contact_number
FROM whatsapp_chats 
WHERE id = '39d89021-95e0-4d01-a47d-7261431e1791';
"

echo ""
echo "📍 4. Reiniciando backend"
echo "------------------------"
pm2 restart govchat-backend
sleep 2
pm2 flush govchat-backend

echo ""
echo "✅ CORREÇÃO CONCLUÍDA!"
echo ""
echo "🧪 TESTE AGORA:"
echo "   1. Acesse: https://atendimento.nextplan.tec.br"
echo "   2. Abra a conversa"
echo "   3. Envie: 'Teste com 9 correto 🚀'"
echo "   4. Verifique no WhatsApp 48 98857-8510"
echo "   5. A mensagem DEVE chegar agora!"
echo ""
echo "📝 Monitore:"
echo "   pm2 logs govchat-backend --lines 30"
echo ""
echo "   Deve mostrar:"
echo "   📲 Enviando para WhatsApp: 55489888578510@s.whatsapp.net"

