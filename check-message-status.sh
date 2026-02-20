#!/bin/bash
echo "🔍 INVESTIGANDO STATUS DAS MENSAGENS"
echo "===================================="
echo ""

echo "📍 1. Verificando método sendMessage no serviço"
echo "-----------------------------------------------"
cd /var/www/govchat/backend/src/services
grep -A 30 "async sendMessage" whatsapp.service.ts | head -35

echo ""
echo "📍 2. Limpando logs e testando"
echo "------------------------------"
pm2 flush govchat-backend
echo "✅ Logs limpos"
echo ""
echo "🧪 Agora ENVIE UMA MENSAGEM pela interface..."
read -p "Pressione ENTER após enviar..." 

echo ""
echo "📍 3. Analisando resposta do Baileys"
echo "------------------------------------"
pm2 logs govchat-backend --lines 100 --nostream | grep -A 30 "Enviando mensagem via WhatsApp"

echo ""
echo "📍 4. Verificando status da mensagem"
echo "------------------------------------"
pm2 logs govchat-backend --lines 100 --nostream | grep -E "(status|Status|ERROR|error|enviada|failed)"

echo ""
echo "📍 5. Comparação: Manual vs Sistema"
echo "-----------------------------------"
echo "✅ Manual (celular): Mensagem CHEGA"
echo "❌ Sistema (Baileys): Mensagem NÃO CHEGA"
echo ""
echo "💡 Possíveis causas:"
echo "   1. Status 1 = SERVER (não significa ENTREGUE)"
echo "   2. Falta aguardar confirmação de entrega"
echo "   3. Socket desconecta antes da entrega"
echo "   4. Número salvo diferente do usado manualmente"
echo ""

echo "📍 6. Testando com número formatado diferente"
echo "---------------------------------------------"
echo "Vamos testar variações de formato:"
echo "  A) 5548988578510@s.whatsapp.net (atual)"
echo "  B) 48988578510@s.whatsapp.net (sem código país)"
echo "  C) 48988578510@c.us (formato antigo)"

echo ""
echo "📍 7. Verificando mensagens no banco"
echo "------------------------------------"
sudo -u postgres psql govchat_nextplan -c "
SELECT 
    to_number,
    content,
    created_at,
    is_from_me
FROM whatsapp_messages 
WHERE created_at > NOW() - INTERVAL '10 minutes'
  AND is_from_me = true
ORDER BY created_at DESC
LIMIT 5;
"

