#!/bin/bash
echo "🔧 CORRIGINDO NOME DO BANCO DE DADOS"
echo "===================================="
echo ""

echo "📍 1. Verificando banco govchat_nextplan"
echo "----------------------------------------"
sudo -u postgres psql -l | grep govchat

echo ""
echo "📍 2. Verificando .env atual"
echo "----------------------------"
if [ -f /var/www/govchat/backend/.env ]; then
    echo "📋 Conteúdo atual do .env:"
    cat /var/www/govchat/backend/.env
else
    echo "❌ Arquivo .env NÃO existe!"
fi

echo ""
echo "📍 3. Verificando conexão no código"
echo "-----------------------------------"
grep -n "govchat" /var/www/govchat/backend/src/server.ts | head -5

echo ""
echo "📍 4. Atualizando DATABASE_URL no .env"
echo "--------------------------------------"
cd /var/www/govchat/backend

# Backup do .env
if [ -f .env ]; then
    cp .env .env.backup_$(date +%Y%m%d_%H%M%S)
    echo "✅ Backup do .env criado"
fi

# Atualizar DATABASE_URL
if grep -q "DATABASE_URL" .env 2>/dev/null; then
    # Substituir DATABASE_URL existente
    sed -i 's|DATABASE_URL=.*|DATABASE_URL=postgresql://postgres:postgres@localhost:5432/govchat_nextplan|g' .env
    echo "✅ DATABASE_URL atualizada"
else
    # Adicionar DATABASE_URL
    echo "" >> .env
    echo "DATABASE_URL=postgresql://postgres:postgres@localhost:5432/govchat_nextplan" >> .env
    echo "✅ DATABASE_URL adicionada"
fi

echo ""
echo "📍 5. Verificando nova configuração"
echo "-----------------------------------"
grep DATABASE_URL .env

echo ""
echo "📍 6. Testando conexão com o banco"
echo "----------------------------------"
sudo -u postgres psql govchat_nextplan -c "SELECT current_database(), count(*) as table_count FROM information_schema.tables WHERE table_schema = 'public';"

echo ""
echo "📍 7. Listando tabelas do banco"
echo "-------------------------------"
sudo -u postgres psql govchat_nextplan -c "\dt"

echo ""
echo "📍 8. Verificando se tabela whatsapp_messages existe"
echo "----------------------------------------------------"
sudo -u postgres psql govchat_nextplan -c "\d whatsapp_messages"

echo ""
echo "📍 9. Recompilando e reiniciando backend"
echo "----------------------------------------"
cd /var/www/govchat/backend
npm run build
pm2 restart govchat-backend

echo ""
echo "📍 10. Verificando status"
echo "-------------------------"
sleep 3
pm2 status govchat-backend
pm2 logs govchat-backend --lines 10 --nostream

echo ""
echo "✅ CORREÇÃO CONCLUÍDA!"
echo ""
echo "🧪 Teste agora:"
echo "   1. Acesse: https://atendimento.nextplan.tec.br"
echo "   2. Faça login"
echo "   3. Clique em uma conversa"
echo "   4. As mensagens devem carregar!"

