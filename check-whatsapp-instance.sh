#!/bin/bash
echo "📱 VERIFICANDO INSTÂNCIA WHATSAPP"
echo "================================="
echo ""

echo "📍 1. Dados da instância no banco"
echo "---------------------------------"
sudo -u postgres psql govchat_nextplan -c "
SELECT 
    id,
    name,
    phone_number,
    status,
    created_at
FROM whatsapp_instances
ORDER BY created_at DESC
LIMIT 3;
"

echo ""
echo "📍 2. Verificando número conectado via Baileys"
echo "----------------------------------------------"
cd /var/www/govchat/backend
echo "Procurando arquivo de sessão..."
find . -name "auth_info_*" -o -name "*.json" | grep -E "(creds|auth)" | head -5

echo ""
echo "📍 3. Logs de conexão WhatsApp"
echo "-----------------------------"
pm2 logs govchat-backend --lines 100 --nostream | grep -E "(conectado|connected|phone|número)" | tail -10

echo ""
echo "📍 4. Testando qual número está na instância"
echo "--------------------------------------------"
echo "Verifique no WhatsApp Web/Desktop:"
echo "  1. Abra WhatsApp no navegador: https://web.whatsapp.com"
echo "  2. Veja qual número está logado"
echo "  3. Compare com: 5548988578510"
echo ""
echo "❓ PERGUNTAS:"
echo "  1. Qual número está conectado no Baileys/WhatsApp?"
echo "  2. O número 48 98857-8510 é SEU número ou do DESTINATÁRIO?"
echo "  3. Você tem acesso ao WhatsApp do número 48 98857-8510?"

echo ""
echo "💡 IMPORTANTE:"
echo "=============="
echo "Para ENVIAR mensagens, você precisa:"
echo "  ✅ Instância conectada ao número da EMPRESA (remetente)"
echo "  ✅ Destinatário com WhatsApp ativo"
echo "  ✅ Destinatário não bloqueou o número da empresa"
echo ""
echo "Exemplo:"
echo "  Empresa: 27 99999-9999 (conectado no Baileys)"
echo "  Cliente: 48 98857-8510 (recebe a mensagem)"

