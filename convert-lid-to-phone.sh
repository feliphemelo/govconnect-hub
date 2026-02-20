#!/bin/bash
echo "📞 CONVERSÃO DE @LID PARA NÚMERO REAL"
echo "====================================="
echo ""

echo "📍 1. Chats atuais no banco"
echo "---------------------------"
sudo -u postgres psql govchat_nextplan -c "
SELECT 
    id,
    contact_name,
    contact_number,
    last_message,
    last_message_at
FROM whatsapp_chats 
ORDER BY last_message_at DESC
LIMIT 5;
"

echo ""
echo "📍 2. Exemplo de conversão"
echo "-------------------------"
echo "De:   32727717949659@lid"
echo "Para: 5527999999999@s.whatsapp.net"
echo ""
echo "Formato esperado:"
echo "  +55 27 99999-9999  →  5527999999999@s.whatsapp.net"
echo "  +55 11 98765-4321  →  5511987654321@s.whatsapp.net"

echo ""
echo "📍 3. INFORME O NÚMERO REAL"
echo "---------------------------"
read -p "Digite o número com DDD (ex: 27999999999): " PHONE_NUMBER

# Validar entrada
if [ -z "$PHONE_NUMBER" ]; then
    echo "❌ Número não informado!"
    exit 1
fi

# Remover caracteres especiais
CLEAN_NUMBER=$(echo "$PHONE_NUMBER" | sed 's/[^0-9]//g')

# Adicionar código do país se não tiver
if [[ ! "$CLEAN_NUMBER" =~ ^55 ]]; then
    CLEAN_NUMBER="55${CLEAN_NUMBER}"
fi

WHATSAPP_ID="${CLEAN_NUMBER}@s.whatsapp.net"

echo ""
echo "✅ Número formatado: $WHATSAPP_ID"

echo ""
echo "📍 4. Atualizando no banco"
echo "-------------------------"
read -p "Deseja atualizar o chat 39d89021-95e0-4d01-a47d-7261431e1791? (s/n): " CONFIRM

if [ "$CONFIRM" = "s" ] || [ "$CONFIRM" = "S" ]; then
    sudo -u postgres psql govchat_nextplan -c "
    UPDATE whatsapp_chats 
    SET contact_number = '$WHATSAPP_ID'
    WHERE id = '39d89021-95e0-4d01-a47d-7261431e1791';
    "
    
    echo ""
    echo "✅ Chat atualizado!"
    
    echo ""
    echo "📍 5. Verificando alteração"
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
    echo "📍 6. Reiniciando backend"
    echo "------------------------"
    pm2 restart govchat-backend
    sleep 2
    pm2 flush govchat-backend
    
    echo ""
    echo "✅ CONVERSÃO CONCLUÍDA!"
    echo ""
    echo "🧪 TESTE AGORA:"
    echo "   1. Acesse: https://atendimento.nextplan.tec.br"
    echo "   2. Abra a conversa"
    echo "   3. Envie uma mensagem"
    echo "   4. Verifique se chega no WhatsApp do número $WHATSAPP_ID"
    echo ""
    echo "📝 Monitore os logs:"
    echo "   pm2 logs govchat-backend --lines 30"
    
else
    echo "❌ Operação cancelada"
fi

