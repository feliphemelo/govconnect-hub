#!/bin/bash
# Script para executar migração do WhatsApp na VPS

echo "🔄 Executando migração da tabela whatsapp_instances..."

# Executar SQL migration
sudo -u postgres psql -d govchat_nextplan -f /var/www/govchat/create_whatsapp_table.sql

if [ $? -eq 0 ]; then
    echo "✅ Migração executada com sucesso!"
    echo ""
    echo "📋 Verificando tabela criada:"
    sudo -u postgres psql -d govchat_nextplan -c "\d whatsapp_instances"
else
    echo "❌ Erro ao executar migração!"
    exit 1
fi

echo ""
echo "🔄 Reiniciando backend..."
pm2 restart govchat-backend
sleep 2
pm2 logs govchat-backend --lines 5 --nostream

echo ""
echo "✅ Migração concluída! Agora você pode acessar as configurações do WhatsApp."
