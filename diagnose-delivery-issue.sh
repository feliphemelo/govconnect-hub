#!/bin/bash
echo "🔍 DIAGNÓSTICO COMPLETO DE ENTREGA"
echo "=================================="
echo ""

echo "📱 Configuração:"
echo "  Remetente (Baileys): 5548991350106"
echo "  Destinatário: 5548988578510"
echo ""

echo "📍 1. Status da instância WhatsApp"
echo "----------------------------------"
sudo -u postgres psql govchat_nextplan -c "
SELECT 
    name,
    phone_number,
    status,
    is_connected,
    last_seen
FROM whatsapp_instances
ORDER BY created_at DESC
LIMIT 1;
"

echo ""
echo "📍 2. Verificando se números estão salvos"
echo "-----------------------------------------"
pm2 logs govchat-backend --lines 50 --nostream | grep -A 5 "Enviando para WhatsApp"

echo ""
echo "📍 3. Testando conexão direta Baileys"
echo "-------------------------------------"
echo "🧪 Vou enviar uma mensagem de teste..."
pm2 flush govchat-backend
sleep 1

echo ""
echo "Agora ENVIE UMA MENSAGEM pela interface e aguarde 3 segundos..."
read -p "Pressione ENTER após enviar..." 

echo ""
echo "📍 4. Logs completos da tentativa de envio"
echo "------------------------------------------"
pm2 logs govchat-backend --lines 50 --nostream

echo ""
echo "📍 5. Checklist de problemas comuns"
echo "-----------------------------------"
echo "❓ O número 48 98857-8510 tem WhatsApp ativo?"
echo "❓ O número 48 99135-0106 está na lista de contatos do 48 98857-8510?"
echo "❓ O 48 98857-8510 bloqueou o 48 99135-0106?"
echo "❓ Os dois números estão no mesmo país/região?"
echo "❓ O WhatsApp do 48 98857-8510 está online?"
echo ""

echo "📍 6. Teste manual"
echo "-----------------"
echo "🧪 TESTE DEFINITIVO:"
echo "   1. Pegue o telefone 48 99135-0106 (conectado no Baileys)"
echo "   2. Abra o WhatsApp normalmente"
echo "   3. Procure o contato 48 98857-8510"
echo "   4. Envie uma mensagem MANUALMENTE"
echo "   5. Se funcionar manualmente, o problema é no código"
echo "   6. Se não funcionar, é problema de bloqueio/contato"
echo ""

echo "📍 7. Verificando se é o mesmo número"
echo "-------------------------------------"
if [ "5548991350106" = "5548988578510" ]; then
    echo "❌ ERRO: Tentando enviar para o MESMO número!"
    echo "   WhatsApp não permite enviar mensagem para si mesmo"
else
    echo "✅ Números diferentes - OK"
    echo "   De: 48 99135-0106"
    echo "   Para: 48 98857-8510"
fi

echo ""
echo "💡 PRÓXIMOS PASSOS:"
echo "=================="
echo "1. Confirme que 48 98857-8510 TEM WhatsApp instalado"
echo "2. Confirme que NÃO bloqueou 48 99135-0106"
echo "3. Tente enviar manualmente do 48 99135-0106 para 48 98857-8510"
echo "4. Se manual funcionar, o problema é no código (vamos corrigir)"
echo "5. Se manual NÃO funcionar, é bloqueio/contato inexistente"

