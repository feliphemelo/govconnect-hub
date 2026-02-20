#!/bin/bash
echo "🔧 CORRIGINDO QUERY UPDATE NO POST MESSAGES"
echo "==========================================="
echo ""

cd /var/www/govchat/backend/src

echo "📍 1. Backup de segurança"
echo "------------------------"
cp server.ts server.ts.backup_post_$(date +%Y%m%d_%H%M%S)
echo "✅ Backup criado"

echo ""
echo "📍 2. Problema identificado (linha 1388)"
echo "----------------------------------------"
echo "❌ WHERE id = \$1 mas passa [content, id]"
echo "💡 Deveria ser: WHERE id = \$2"
grep -n "UPDATE whatsapp_chats SET last_message" server.ts

echo ""
echo "📍 3. Aplicando correção"
echo "-----------------------"
# Corrigir a query UPDATE que tem o problema
sed -i "s|'UPDATE whatsapp_chats SET last_message = \$1, last_message_at = NOW(), total_messages = total_messages + 1 WHERE id = \$1'|'UPDATE whatsapp_chats SET last_message = \$1, last_message_at = NOW(), total_messages = total_messages + 1 WHERE id = \$2'|g" server.ts

echo "✅ Correção aplicada"

echo ""
echo "📍 4. Verificando correção"
echo "-------------------------"
grep -n "UPDATE whatsapp_chats SET last_message" server.ts

echo ""
echo "📍 5. Mostrando contexto (linhas 1385-1395)"
echo "-------------------------------------------"
sed -n '1385,1395p' server.ts

echo ""
echo "📍 6. Recompilando"
echo "-----------------"
cd /var/www/govchat/backend
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Compilação OK"
    
    echo ""
    echo "📍 7. Reiniciando"
    echo "----------------"
    pm2 restart govchat-backend
    sleep 3
    pm2 status govchat-backend
    
    echo ""
    echo "📍 8. Limpando logs para teste"
    echo "------------------------------"
    pm2 flush govchat-backend
    
    echo ""
    echo "✅ CORREÇÃO CONCLUÍDA!"
    echo ""
    echo "🧪 TESTE AGORA:"
    echo "   1. Acesse: https://atendimento.nextplan.tec.br"
    echo "   2. Abra uma conversa"
    echo "   3. Digite e envie uma mensagem"
    echo "   4. A mensagem deve:"
    echo "      ✅ Aparecer na interface"
    echo "      ✅ Ser enviada para o WhatsApp"
    echo "      ✅ Não dar erro 500"
    echo ""
    echo "📝 Se der erro, execute:"
    echo "   pm2 logs govchat-backend --err --lines 30"
    
else
    echo "❌ Erro na compilação!"
    cp server.ts.backup_post_* server.ts
    echo "✅ Backup restaurado"
fi

