#!/bin/bash
echo "🔧 CORRIGINDO BUG DO PARÂMETRO SQL"
echo "=================================="
echo ""

cd /var/www/govchat/backend/src

echo "📍 1. Backup de segurança"
echo "------------------------"
cp server.ts server.ts.backup_param_$(date +%Y%m%d_%H%M%S)
echo "✅ Backup criado"

echo ""
echo "📍 2. Mostrando linha com erro"
echo "------------------------------"
grep -n "WHERE id = \$2" server.ts

echo ""
echo "📍 3. Corrigindo \$2 para \$1"
echo "----------------------------"
sed -i 's/WHERE id = \$2/WHERE id = \$1/g' server.ts

echo "✅ Correção aplicada"

echo ""
echo "📍 4. Verificando correção"
echo "-------------------------"
grep -n "WHERE id = \$1" server.ts | grep "whatsapp_chats"

echo ""
echo "📍 5. Mostrando contexto completo da query"
echo "------------------------------------------"
sed -n '1330,1360p' server.ts

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
    
    echo ""
    echo "📍 8. Testando endpoint diretamente"
    echo "-----------------------------------"
    pm2 flush govchat-backend
    
    # Fazer requisição de teste
    echo "🧪 Teste com curl..."
    curl -s -w "\nHTTP Status: %{http_code}\n" \
      -H "Authorization: Bearer test" \
      https://atendimento.nextplan.tec.br/api/conversations/39d89021-95e0-4d01-a47d-7261431e1791/messages \
      | head -20
    
    echo ""
    echo "📝 Logs após teste:"
    sleep 2
    pm2 logs govchat-backend --lines 30 --nostream
    
    echo ""
    echo "✅ CORREÇÃO CONCLUÍDA!"
    echo ""
    echo "🧪 Teste agora no navegador:"
    echo "   1. Pressione F5 para recarregar"
    echo "   2. Faça login"
    echo "   3. Clique na conversa"
    echo "   4. As mensagens devem carregar! ✅"
    
else
    echo "❌ Erro na compilação!"
    cp server.ts.backup_param_* server.ts
    echo "✅ Backup restaurado"
fi

